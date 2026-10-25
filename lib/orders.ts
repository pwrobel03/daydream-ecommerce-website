// lib/orders.ts
import { db } from "@/lib/db";

/**
 * Anuluje zamówienie i zwraca zarezerwowany towar na stan.
 *
 * Zmiana statusu jest warunkowa i wykonana jako pierwsza, więc dwa równoległe
 * wywołania (ponowiony webhook i cron trafiające w to samo zamówienie) nie
 * zwrócą towaru dwa razy — drugie zobaczy `count === 0` i wyjdzie.
 *
 * Zwraca `true`, jeśli to wywołanie faktycznie anulowało zamówienie.
 */
export async function releaseOrderReservation(orderId: string) {
  return db.$transaction((tx) => releaseOrderReservationIn(tx, orderId));
}

export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** To samo co `releaseOrderReservation`, ale w transakcji wywołującego. */
export async function releaseOrderReservationIn(tx: Tx, orderId: string) {
  const cancelled = await tx.order.updateMany({
    where: { id: orderId, status: "PENDING", isPaid: false },
    data: { status: "CANCELLED" },
  });

  if (cancelled.count !== 1) return false;

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

  return true;
}
