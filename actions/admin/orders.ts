"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { reportError } from "@/lib/logger";
import { ActionError, ActionResult, failFrom, ok } from "@/lib/action-result";
import { nextOrderStatus } from "@/lib/order-transitions";
import { releaseOrderReservationIn } from "@/lib/orders";

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  try {
    await requireAdmin(); // Sprawdzamy uprawnienia admina
    const conflict = async () =>
      new ActionError("CONFLICT", (await getTranslations("errors"))("orderStatusConflict"));

    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (!order) throw new ActionError("NOT_FOUND", "Order not found");
      if (nextOrderStatus(order.status) !== status) throw await conflict();

      // The status in the WHERE makes a concurrent change lose instead of overwrite.
      const changed =
        status === "CANCELLED"
          ? await releaseOrderReservationIn(tx, orderId)
          : (await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status } })).count === 1;
      if (!changed) throw await conflict();
    });

    // To odświeża dane na stronie admina natychmiast po zmianie
    revalidatePath("/dashboard/manage-orders");
    
    return ok();
  } catch (error) {
    reportError(error, { area: "admin.orders" });
    return failFrom(error, "INTERNAL", "Database error");
  }
}
