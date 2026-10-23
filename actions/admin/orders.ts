"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { reportError } from "@/lib/logger";
import { ActionResult, failFrom, ok } from "@/lib/action-result";


export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  await requireAdmin(); // Sprawdzamy uprawnienia admina
  try {
    await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });

    // To odświeża dane na stronie admina natychmiast po zmianie
    revalidatePath("/dashboard/manage-orders");
    
    return ok();
  } catch (error) {
    reportError(error, { area: "admin.orders" });
    return failFrom(error, "INTERNAL", "Database error");
  }
}
