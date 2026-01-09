// actions/address.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveUserAddress(values: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { addressId: true }
    });

    if (user?.addressId) {
      // Aktualizacja istniejącego adresu
      await db.address.update({
        where: { id: user.addressId },
        data: { ...values }
      });
    } else {
      // Tworzenie nowego i podpięcie pod User
      const newAddress = await db.address.create({
        data: { ...values }
      });

      await db.user.update({
        where: { id: session.user.id },
        data: { addressId: newAddress.id }
      });
    }

    revalidatePath("/dashboard/address");
    return { success: "Your address was changed sucessfully!" };
  } catch (error) {
    return { error: "Invalid error!" };
  }
}