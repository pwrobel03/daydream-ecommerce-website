// actions/order.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function initializeOrder(items: any[]) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Musisz być zalogowany, aby kontynuować." };
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      let total = 0;

      // 1. Walidacja stanów i obliczenie sumy
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product.id },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Produkt ${item.product.name} jest już niedostępny.`);
        }

        const price = product.promoPrice ? Number(product.promoPrice) : Number(product.price);
        total += price * item.quantity;

        // 2. Odejmujemy stan magazynowy
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Tworzymy zamówienie (PENDING, bez adresu)
      const order = await tx.order.create({
        data: {
          userId: session.user.id!,
          totalAmount: total,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.promoPrice || item.product.price, // Snapshot ceny
            })),
          },
        },
      });

      return order.id;
    });

    return { success: true, orderId };
  } catch (error: any) {
    return { error: error.message || "Coś poszło nie tak podczas rezerwacji." };
  }
}

export async function finalizeOrderAddress(orderId: string, addressData: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Tworzymy lub aktualizujemy rekord adresu
      const address = await tx.address.create({
        data: {
          ...addressData,
        },
      });

      // 2. Łączymy adres z zamówieniem
      await tx.order.update({
        where: { id: orderId, userId: session.user.id },
        data: { addressId: address.id },
      });

      // 3. Aktualizujemy stały adres w profilu użytkownika
      await tx.user.update({
        where: { id: session.user.id },
        data: { addressId: address.id },
      });

      return { success: "Delivery details provide correctly!!" };
    });

    revalidatePath(`/cart/delivery/${orderId}`);
    return { success: "Delivery details provide correctly!!"};
  } catch (error) {
    return { error: "Failed to finalize delivery details." };
  }
}