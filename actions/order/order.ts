// actions/order.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { errorMessage } from "@/lib/action-result";
import { reportError } from "@/lib/logger";
import { AddressSchema, CheckoutItemsSchema } from "@/schemas";
import { createCheckoutSession } from "@/lib/checkout-session";
import { requireOwnedOrder } from "@/lib/guards";
import { Prisma } from "@/lib/generated/prisma/client";
import * as z from "zod";
import { getTranslations } from "next-intl/server";

// Jak długo trzymamy towar zarezerwowany dla niedokończonego zamówienia.
// Wartość z zapasem względem 30-minutowej ważności sesji Stripe.
const RESERVATION_MINUTES = 45;

export async function initializeOrder(
  items: z.infer<typeof CheckoutItemsSchema>,
  couponCode?: string
) {
  // Komunikat wraca do interfejsu, więc musi być w języku bieżącej trasy.
  const t = await getTranslations("errors");
  const session = await auth();

  if (!session?.user?.id) {
    return { error: t("mustBeSignedIn") };
  }

  const validated = CheckoutItemsSchema.safeParse(items);
  if (!validated.success) {
    return { error: t("invalidCart") };
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
        throw new Error(t("someProductUnavailable"));
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
          throw new Error(t("productUnavailable", { name: product.name }));
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
        throw new Error(t("invalidCoupon"));
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
    return { error: errorMessage(error, t("reservationFailed")) };
  }
}

export async function finalizeAndPay(
  orderId: string,
  addressData: z.infer<typeof AddressSchema>
) {
  const t = await getTranslations("errors");
  const session = await auth();
  if (!session?.user?.id) return { error: t("unauthorized") };

  const validatedAddress = AddressSchema.safeParse(addressData);
  if (!validatedAddress.success) {
    return { url: null, error: t("invalidAddress") };
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

    const url = await createCheckoutSession(order, {
      cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/cart`,
      expiresInMinutes: 30,
    });

    return { url, error: null };
  } catch (error) {
    reportError(error, { area: "order.finalizeAndPay", orderId });
    return { url: null, error: "Stripe Session Error" };
  }
}

export async function recreateStripeSession(orderId: string) {
  try {
    // Ten sam guard co przy pierwszej płatności — zamówienie musi należeć do
    // wywołującego i wciąż czekać na zapłatę.
    const order = await requireOwnedOrder(orderId, { pendingOnly: true });

    // Wcześniej ta ścieżka budowała pozycje samodzielnie i pomijała rabat,
    // więc ponowienie płatności kosztowało klienta więcej niż pierwsze
    // podejście. Wspólny budowniczy usuwa tę rozbieżność.
    const url = await createCheckoutSession(order, {
      cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
    });

    return { url };
  } catch (error) {
    reportError(error, { area: "order.recreateStripeSession", orderId });
    return { error: "Failed to recreate payment session" };
  }
}