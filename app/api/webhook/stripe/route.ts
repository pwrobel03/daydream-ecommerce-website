import Stripe from "stripe";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { releaseOrderReservation } from "@/lib/orders";
import { reportError, logger } from "@/lib/logger";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Zdarzenia, na które reagujemy. Reszta jest kwitowana 200 bez zapisu,
// żeby nie zaśmiecać rejestru idempotencji.
const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
];

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
  } catch (error: any) {
    reportError(error, { area: "webhook.signature" });
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (!HANDLED_EVENTS.includes(event.type)) {
    return new NextResponse("Ignored", { status: 200 });
  }

  // Idempotencja: id eventu jest kluczem głównym, więc ponowione dostarczenie
  // odbija się na kolizji i kończy tutaj, zanim wykonamy jakąkolwiek logikę.
  try {
    await db.processedWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new NextResponse("Already processed", { status: 200 });
    }
    throw error;
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
    const expected = Math.round(order.totalAmount.mul(100).toNumber());
    if (session.amount_total !== expected) {
      logger.error(
        { eventId: event.id, orderId, paid: session.amount_total, expected },
        "webhook amount mismatch"
      );
      return new NextResponse("Amount mismatch", { status: 200 });
    }

    await db.order.update({
      where: { id: orderId },
      data: { isPaid: true, status: "PAID" },
    });

    return new NextResponse("Webhook received", { status: 200 });
  }

  // Płatność nieudana lub sesja wygasła — zwracamy towar na stan.
  await releaseOrderReservation(orderId);

  return new NextResponse("Webhook received", { status: 200 });
}
