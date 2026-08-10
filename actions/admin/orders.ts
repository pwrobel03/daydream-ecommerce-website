"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/lib/generated/prisma/client";

/**
 * Pobiera zamówienia dla panelu admina z uwzględnieniem globalnego szukania i stronnicowania.
 */
export const getAdminOrders = async (page: number = 1, pageSize: number = 15, search?: string) => {
  await requireAdmin(); // Bezpieczeństwo przede wszystkim
  try {
    const skip = (page - 1) * pageSize;

    // Definiujemy filtr wyszukiwania - przeszukuje CAŁĄ bazę danych
    const where = search ? {
      OR: [
        { id: { contains: search, mode: 'insensitive' as const } },
        { user: { name: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
        { address: { street: { contains: search, mode: 'insensitive' as const } } },
      ]
    } : {};

    // Wykonujemy zapytania równolegle dla lepszej wydajności
    const [orders, totalCount] = await Promise.all([
      db.order.findMany({
        where,
        take: pageSize, // Pobierz tylko tyle, ile mieści się na stronie
        skip: skip,     // Pomiń poprzednie strony
        include: {
          user: { select: { name: true, email: true } },
          address: true,
          items: {
            include: {
              product: { select: { name: true } }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.order.count({ where }) // Liczba wszystkich pasujących rekordów w bazie
    ]);

    // Serializacja: usuwamy obiekty Decimal i Date, zamieniając je na proste typy JSON
    return {
      orders: JSON.parse(JSON.stringify(orders)),
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount
    };
  } catch (error) {
    console.error("Logistics Database Error:", error);
    return { orders: [], totalPages: 0, totalCount: 0 };
  }
};

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
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
    
    return { success: true };
  } catch (error) {
    console.error("FAILED TO UPDATE STATUS:", error);
    return { success: false, error: "Database error" };
  }
}
