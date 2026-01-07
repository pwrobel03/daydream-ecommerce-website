"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

// Pomocnicza funkcja do weryfikacji admina na serwerze

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}


export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await checkAdmin
  try {
    await db.order.update({
      where: { id: orderId },
      data: { status },
    });
    revalidatePath("/admin/manage-orders");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
