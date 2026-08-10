// actions/order.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { errorMessage } from "@/lib/action-result";
import { reportError } from "@/lib/logger";
import { AddressSchema, CheckoutItemsSchema } from "@/schemas";
import { Prisma } from "@/lib/generated/prisma/client";
import Stripe from "stripe";
import * as z from "zod";

// Jak długo trzymamy towar zarezerwowany dla niedokończonego zamówienia.
// Wartość z zapasem względem 30-minutowej ważności sesji Stripe.
const RESERVATION_MINUTES = 45;

export async function initializeOrder(
  items: z.infer<typeof CheckoutItemsSchema>,
  couponCode?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Musisz być zalogowany, aby kontynuować." };
  }

  const validated = CheckoutItemsSchema.safeParse(items);
  if (!validated.success) {
    return { error: "Nieprawidłowa zawartość koszyka." };
  }

  // Scalamy powtórzone pozycje — inaczej ten sam produkt przysłany dwa razy
  // przechodziłby dwie niezależne kontrole stanu magazynowego.
  const quantities = new Map<string, number>();
  for (const item of validated.data) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity
    );
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] } },
        select: { id: true, name: true, price: true, promoPrice: true },
      });

      if (products.length !== quantities.size) {
        throw new Error("Któryś z produktów nie jest już dostępny.");
      }

      let subtotal = new Prisma.Decimal(0);
      const orderItems: { productId: string; quantity: number; price: Prisma.Decimal }[] = [];

      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        // Warunek na stanie magazynowym jest częścią UPDATE, więc rezerwacja jest
        // atomowa — dwa równoległe zamówienia nie zejdą poniżej zera.
        const reserved = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (reserved.count !== 1) {
          throw new Error(`Produkt ${product.name} jest już niedostępny.`);
        }

        // Cena zawsze z bazy, nigdy z danych przysłanych przez klienta.
        const unitPrice = product.promoPrice ?? product.price;
        subtotal = subtotal.add(unitPrice.mul(quantity));
        orderItems.push({ productId: product.id, quantity, price: unitPrice });
      }

      // Kupon jest weryfikowany tutaj, w tej samej transakcji co ceny — kod od
      // klienta służy wyłącznie do wyszukania rekordu, a wysokość rabatu bierze
      // się z bazy. Ta sama zasada co przy cenach pozycji (§1.1).
      const sale = couponCode
        ? await tx.sale.findFirst({
            where: {
              couponCode: couponCode.trim(),
              isActive: true,
              validFrom: { lte: new Date() },
              validTo: { gte: new Date() },
            },
          })
        : null;

      if (couponCode && !sale) {
        throw new Error("Ten kupon jest nieprawidłowy lub wygasł.");
      }

      // Zaokrąglamy do groszy tu, a nie przy tworzeniu sesji Stripe — dzięki
      // temu kwota zapisana w bazie i kwota zapłacona są tą samą liczbą,
      // a weryfikacja w webhooku nie odrzuci płatności z powodu zaokrąglenia.
      const discount = sale
        ? subtotal.mul(sale.discountValue).div(100).toDecimalPlaces(2)
        : new Prisma.Decimal(0);

      const total = subtotal.sub(discount);

      // Tworzymy zamówienie (PENDING, bez adresu).
      // reservedUntil wyznacza moment, po którym zadanie cykliczne zwolni towar,
      // jeśli klient nigdy nie dojdzie do płatności.
      const order = await tx.order.create({
        data: {
          userId: session.user.id!,
          totalAmount: total,
          discountAmount: discount,
          saleId: sale?.id ?? null,
          items: { create: orderItems },
          reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
        },
      });

      return order.id;
    });

    return { success: true, orderId };
  } catch (error) {
    return { error: errorMessage(error, "Coś poszło nie tak podczas rezerwacji.") };
  }
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function finalizeAndPay(
  orderId: string,
  addressData: z.infer<typeof AddressSchema>
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validatedAddress = AddressSchema.safeParse(addressData);
  if (!validatedAddress.success) {
    return { url: null, error: "Nieprawidłowe dane adresowe." };
  }

  try {
    // Transakcja obejmuje wyłącznie zapisy w bazie. Wywołanie sieciowe do Stripe
    // trzymałoby połączenie z puli i groziło rollbackiem już po utworzeniu sesji
    // płatności — czyli obciążeniem klienta za zamówienie, którego nie ma w bazie.
    const order = await db.$transaction(async (tx) => {
      const existing = await tx.order.findFirst({
        where: {
          id: orderId,
          userId: session.user!.id,
          status: "PENDING",
          isPaid: false,
        },
        select: { id: true },
      });

      if (!existing) throw new Error("Order not found or already processed");

      // Adres zamówienia jest snapshotem — tak samo jak cena w OrderItem.
      // Musi być osobnym wierszem, inaczej późniejsza edycja adresu w profilu
      // przepisałaby adres dostawy na już zrealizowanych zamówieniach.
      const orderAddress = await tx.address.create({
        data: validatedAddress.data,
      });

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { addressId: orderAddress.id },
        include: { items: { include: { product: true } } },
      });

      // Adres profilowy aktualizujemy w miejscu, bez tworzenia kolejnego wiersza
      // przy każdym podejściu do kasy.
      const user = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { addressId: true },
      });

      if (user?.addressId) {
        await tx.address.update({
          where: { id: user.addressId },
          data: validatedAddress.data,
        });
      } else {
        const profileAddress = await tx.address.create({
          data: validatedAddress.data,
        });
        await tx.user.update({
          where: { id: session.user!.id },
          data: { addressId: profileAddress.id },
        });
      }

      return updated;
    });

    // Kupon na KWOTĘ, nie na procent. Procent kazałby Stripe'owi liczyć rabat
    // po swojemu, a jego zaokrąglenie mogłoby różnić się o grosz od kwoty
    // zapisanej w bazie — i webhook odrzuciłby wtedy poprawną płatność,
    // bo porównuje amount_total z totalAmount.
    const discountCents = Math.round(Number(order.discountAmount) * 100);
    const discounts =
      discountCents > 0
        ? [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: discountCents,
                  currency: "usd",
                  duration: "once",
                  name: "Discount",
                })
              ).id,
            },
          ]
        : undefined;

    const stripeSession = await stripe.checkout.sessions.create({
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      discounts,
      line_items: order.items.map(item => ({
        price_data: {
          currency: "USD",
          product_data: { name: item.product.name },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      // Metadane muszą trafić także do PaymentIntenta — inaczej webhook
      // payment_intent.payment_failed nie ma jak powiązać zdarzenia z zamówieniem.
      payment_intent_data: { metadata: { orderId } },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/order/success/${orderId}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: { orderId }
    });

    if (!stripeSession.url) throw new Error("Stripe session failed");

    await db.order.update({
      where: { id: orderId },
      data: { stripeSessionId: stripeSession.id }
    });

    return { url: stripeSession.url, error: null };
  } catch (error) {
    reportError(error, { area: "order.finalizeAndPay", orderId });
    return { url: null, error: "Stripe Session Error" };
  }
}

export async function recreateStripeSession(orderId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) return { error: "Unauthorized" };

  try {
    const order = await db.order.findUnique({
      where: { 
        id: orderId,
        userId: sessionAuth.user.id,
        status: "PENDING", // Tylko dla zamówień oczekujących
        isPaid: false 
      },
      include: { items: { include: { product: true } } }
    });

    if (!order) return { error: "Order not found or already processed" };

    // Tworzymy nową sesję Stripe (logika identyczna jak przy pierwszym razie)
    const stripeSession = await stripe.checkout.sessions.create({
      line_items: order.items.map(item => ({
        price_data: {
          currency: "USD",
          product_data: { name: item.product.name },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      // Metadane muszą trafić także do PaymentIntenta — inaczej webhook
      // payment_intent.payment_failed nie ma jak powiązać zdarzenia z zamówieniem.
      payment_intent_data: { metadata: { orderId } },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/order/success/${orderId}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
      metadata: { orderId }
    });

    if (!stripeSession.url) throw new Error("Stripe session failed");

    // Aktualizujemy ID sesji w bazie danych
    await db.order.update({
      where: { id: orderId },
      data: { stripeSessionId: stripeSession.id }
    });

    return { url: stripeSession.url };
  } catch (error) {
    reportError(error, { area: "order.recreateStripeSession", orderId });
    return { error: "Failed to recreate payment session" };
  }
}