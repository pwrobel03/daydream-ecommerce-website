// actions/address.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AddressSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import * as z from "zod";

export async function saveUserAddress(values: z.infer<typeof AddressSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = AddressSchema.safeParse(values);
  if (!validated.success) return { error: "Nieprawidłowe dane adresowe." };

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { addressId: true }
    });

    if (user?.addressId) {
      // Aktualizacja istniejącego adresu
      await db.address.update({
        where: { id: user.addressId },
        data: validated.data
      });
    } else {
      // Tworzenie nowego i podpięcie pod User
      const newAddress = await db.address.create({
        data: validated.data
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