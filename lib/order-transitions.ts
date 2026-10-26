import type { OrderStatus } from "@/lib/generated/prisma/client";

// Only transitions that keep stock correct (ADR 0009): a pending order is cancelled
// through the reservation release, and PAID/SHIPPED can only be reached by the webhook.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CANCELLED",
  PAID: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return NEXT[status] ?? null;
}
