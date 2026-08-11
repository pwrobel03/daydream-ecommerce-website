// actions/address.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reportError } from "@/lib/logger";
import { AddressSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { getTranslations } from "next-intl/server";
import { ActionResult, fail, ok } from "@/lib/action-result";

export async function saveUserAddress(
  values: z.infer<typeof AddressSchema>
): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const session = await auth();
  if (!session?.user?.id) return fail("UNAUTHORIZED", t("unauthorized"));

  const validated = AddressSchema.safeParse(values);
  if (!validated.success) return fail("INVALID_INPUT", t("invalidAddress"));

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
    return ok();
  } catch (error) {
    reportError(error, { area: "user.saveAddress", userId: session.user.id });
    return fail("INTERNAL", t("addressSaveFailed"));
  }
}