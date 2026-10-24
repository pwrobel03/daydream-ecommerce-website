// actions/order.ts
"use server";

import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ActionError, ActionResult, fail, failFrom, ok } from "@/lib/action-result";
import { reportError } from "@/lib/logger";
import { AddressSchema, CheckoutItemsSchema } from "@/schemas";
import { MAX_UNITS_PER_LINE } from "@/lib/order-limits";
import { createCheckoutSession } from "@/lib/checkout-session";
import { requireOwnedOrder } from "@/lib/guards";
import * as z from "zod";
import { getTranslations } from "next-intl/server";

// Jak długo trzymamy towar zarezerwowany dla niedokończonego zamówienia.
// Wartość z zapasem względem 30-minutowej ważności sesji Stripe.
const RESERVATION_MINUTES = 45;

export async function initializeOrder(
  items: z.infer<typeof CheckoutItemsSchema>,
  couponCode?: string
): Promise<ActionResult<{ orderId: string }>> {
  // Komunikat wraca do interfejsu, więc musi być w języku bieżącej trasy.
  const t = await getTranslations("errors");
  const session = await getSession();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", t("mustBeSignedIn"));
  }

  const validated = CheckoutItemsSchema.safeParse(items);
  if (!validated.success) {
    return fail("INVALID_INPUT", t("invalidCart"));
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

  // Limit liczymy po scaleniu, więc dwie pozycje po 6 to 12. Nic nie jest
  // jeszcze zarezerwowane, więc odrzucamy przed transakcją.
  if ([...quantities.values()].some((q) => q > MAX_UNITS_PER_LINE)) {
    return fail("INVALID_INPUT", t("quantityLimit", { max: MAX_UNITS_PER_LINE }));
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] } },
        select: { id: true, name: true, price: true, promoPrice: true },
      });

      if (products.length !== quantities.size) {
        throw new ActionError("OUT_OF_STOCK", t("someProductUnavailable"));
      }

      // Liczymy w groszach, na liczbach całkowitych. Rozszerzenie klienta
      // Prismy zwraca ceny jako `number`, a sumowanie pieniędzy na floatach
      // kumuluje błąd zaokrągleń — 0.1 + 0.2 nie jest 0.3.
      let subtotalCents = 0;
      const orderItems: { productId: string; quantity: number; price: number }[] = [];

      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        // Warunek na stanie magazynowym jest częścią UPDATE, więc rezerwacja jest
        // atomowa — dwa równoległe zamówienia nie zejdą poniżej zera.
        const reserved = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (reserved.count !== 1) {
          throw new ActionError("OUT_OF_STOCK", t("productUnavailable", { name: product.name }));
        }

        // Cena zawsze z bazy, nigdy z danych przysłanych przez klienta.
        // Ta sama reguła co w koszyku — patrz lib/pricing.ts.
        const unitPrice = product.promoPrice ?? product.price;
        subtotalCents += Math.round(unitPrice * 100) * quantity;
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
        throw new ActionError("INVALID_COUPON", t("invalidCoupon"));
      }

      // Rabat też w groszach: dzięki temu kwota zapisana w bazie i kwota
      // pobrana przez Stripe to ta sama liczba, a weryfikacja w webhooku nie
      // odrzuci poprawnej płatności z powodu zaokrąglenia.
      const discountCents = sale
        ? Math.round((subtotalCents * sale.discountValue) / 100)
        : 0;

      const discount = discountCents / 100;
      const total = (subtotalCents - discountCents) / 100;

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

    return ok({ orderId });
  } catch (error) {
    return failFrom(error, "INTERNAL", t("reservationFailed"));
  }
}

export async function finalizeAndPay(
  orderId: string,
  addressData: z.infer<typeof AddressSchema>
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations("errors");
  const session = await getSession();
  if (!session?.user?.id) return fail("UNAUTHORIZED", t("unauthorized"));

  const validatedAddress = AddressSchema.safeParse(addressData);
  if (!validatedAddress.success) {
    return fail("INVALID_INPUT", t("invalidAddress"));
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

      if (!existing) {
        throw new ActionError("NOT_FOUND", "Order not found or already processed");
      }

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

    return ok({ url });
  } catch (error) {
    reportError(error, { area: "order.finalizeAndPay", orderId });
    return failFrom(error, "PAYMENT_ERROR", t("paymentSessionFailed"));
  }
}

export async function recreateStripeSession(
  orderId: string
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations("errors");

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

    return ok({ url });
  } catch (error) {
    reportError(error, { area: "order.recreateStripeSession", orderId });
    return failFrom(error, "PAYMENT_ERROR", t("paymentSessionFailed"));
  }
}