import Stripe from "stripe";
import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { releaseOrderReservationIn, type Tx } from "@/lib/orders";
import { errorMessage, logger, reportError } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mail";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Zdarzenia, na które reagujemy. Reszta jest kwitowana 200 bez zapisu,
// żeby nie zaśmiecać rejestru idempotencji.
const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
];

// Idempotencja: id eventu jest kluczem głównym, a wiersz powstaje w tej samej
// transakcji co zmiana zamówienia. Zapisuje się więc tylko razem z nią — nieudana
// obsługa zostawia Stripe'owi ponowienie, a udana odbija się na kolizji (P2002).
function recordEvent(tx: Tx, event: Stripe.Event) {
  return tx.processedWebhookEvent.create({
    data: { id: event.id, type: event.type },
  });
}

function isAlreadyProcessed(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    reportError(error, { area: "webhook.signature" });
    return new NextResponse(`Webhook Error: ${errorMessage(error, "invalid signature")}`, { status: 400 });
  }

  // ADR 0005: zdarzenia trybu live potwierdzamy, ale niczego z nimi nie robimy.
  if (event.livemode) {
    reportError(new Error("Live-mode Stripe event ignored"), {
      area: "webhook.livemode",
      eventId: event.id,
    });
    return new NextResponse("Ignored", { status: 200 });
  }

  if (!HANDLED_EVENTS.includes(event.type)) {
    return new NextResponse("Ignored", { status: 200 });
  }

  const object = event.data.object as
    | Stripe.Checkout.Session
    | Stripe.PaymentIntent;
  const orderId = object?.metadata?.orderId;

  if (!orderId) {
    // Ponowienie tego nie naprawi — kwitujemy 200, ale zostawiamy ślad w logach.
    logger.error({ eventId: event.id, eventType: event.type }, "webhook without orderId");
    return new NextResponse("No Order ID", { status: 200 });
  }

  if (event.type === "checkout.session.completed") {
    const session = object as Stripe.Checkout.Session;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true, stripeSessionId: true },
    });

    if (!order) {
      logger.error({ eventId: event.id, orderId }, "webhook order not found");
      return new NextResponse("Order not found", { status: 200 });
    }

    // Sesja musi być tą, którą sami utworzyliśmy dla tego zamówienia.
    if (order.stripeSessionId && order.stripeSessionId !== session.id) {
      logger.error({ eventId: event.id, orderId }, "webhook session mismatch");
      return new NextResponse("Session mismatch", { status: 200 });
    }

    // Kwota zapłacona musi zgadzać się z sumą zamówienia (Stripe liczy w groszach).
    const expected = Math.round(order.totalAmount * 100);
    if (session.amount_total !== expected) {
      logger.error(
        { eventId: event.id, orderId, paid: session.amount_total, expected },
        "webhook amount mismatch"
      );
      return new NextResponse("Amount mismatch", { status: 200 });
    }

    // Testowa płatność oddaje towar na stan (ADR 0009). Zwrot tylko wtedy, gdy to
    // my przeprowadzamy PENDING -> PAID; zamówienie już anulowane (expired,
    // nieudana płatność, cron) oddało towar wcześniej.
    try {
      await db.$transaction(async (tx) => {
        await recordEvent(tx, event);

        const paid = await tx.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { isPaid: true, status: "PAID" },
        });

        if (paid.count !== 1) {
          await tx.order.update({
            where: { id: orderId },
            data: { isPaid: true, status: "PAID" },
          });
          return;
        }

        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } catch (error) {
      if (isAlreadyProcessed(error)) {
        return new NextResponse("Already processed", { status: 200 });
      }
      throw error;
    }

    await sendOrderConfirmation(orderId);

    return new NextResponse("Webhook received", { status: 200 });
  }

  // Płatność nieudana lub sesja wygasła — zwracamy towar na stan.
  try {
    await db.$transaction(async (tx) => {
      await recordEvent(tx, event);
      await releaseOrderReservationIn(tx, orderId);
    });
  } catch (error) {
    if (isAlreadyProcessed(error)) {
      return new NextResponse("Already processed", { status: 200 });
    }
    throw error;
  }

  return new NextResponse("Webhook received", { status: 200 });
}

/**
 * Potwierdzenie zamówienia po zaksięgowanej płatności.
 *
 * Wysyłka jest świadomie po zapisie statusu i nie blokuje odpowiedzi błędem:
 * zamówienie jest już opłacone, a nieudany mail nie może skłonić Stripe do
 * ponowienia zdarzenia — od tego jest rejestr idempotencji.
 */
async function sendOrderConfirmation(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true } },
      address: true,
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order?.user.email) {
    logger.error({ orderId }, "order confirmation skipped: no recipient");
    return;
  }

  const items = order.items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: Number(item.price),
  }));

  const discount = Number(order.discountAmount);
  const total = Number(order.totalAmount);

  await sendOrderConfirmationEmail(order.user.email, {
    orderId: order.id,
    items,
    // Suma przed rabatem odtworzona z pozycji — nie trzymamy jej w bazie.
    subtotal: total + discount,
    discount,
    total,
    address: order.address
      ? {
          fullName: order.address.fullName,
          street: order.address.street,
          city: order.address.city,
          zipCode: order.address.zipCode,
        }
      : null,
  });
}
