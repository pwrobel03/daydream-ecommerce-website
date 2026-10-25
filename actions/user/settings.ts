"use server"
import * as z from "zod"
import { SettingsSchema } from "@/schemas"
import { getCurrentUser } from "@/lib/auth"
import { getUserById, getUserByEmail } from "@/data/user"
import { db } from "@/lib/db"
import { Prisma } from "@/lib/generated/prisma/client"
import { generateVerificationToken } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/mail"
import { revalidatePath } from "next/cache"
import bcrypt from "bcrypt"
import { requireOwnAccountWrites } from "@/lib/guards";
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result";
import { getClientIp } from "@/lib/rate-limit";

// actions/settings.ts
/**
 * Zwraca `emailChanged`, a nie gotowy komunikat: interfejs pokazuje inny
 * tekst, kiedy zmiana maila wymaga ponownej weryfikacji, i tylko on wie,
 * w jakim języku ma go pokazać.
 */
export const settings = async (
  values: z.infer<typeof SettingsSchema>
): Promise<ActionResult<{ emailChanged: boolean; emailSent: boolean }>> => {
  try {
    await requireOwnAccountWrites();
  } catch (error) {
    return failFrom(error, "UNAUTHORIZED", "Unauthorized!");
  }
  const user = await getCurrentUser();
  if (!user || !user.id) return fail("UNAUTHORIZED", "Unauthorized!");

  const dbUser = await getUserById(user.id);
  if (!dbUser) return fail("NOT_FOUND", "User not found!");

  // 1. Kopiujemy dane z formularza do obiektu, który trafi do bazy
  // TypeScript pozwoli nam dodać tu pola z modelu Prisma
  const updateData: Prisma.UserUpdateInput = {
    name: values.name,
  };

  // 2. Obsługa OAuth (blokada zmian wrażliwych)
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
  }

  let emailSent = true;

  // 3. Logika zmiany EMAIL (Natychmiastowa zmiana + cofnięcie weryfikacji)
  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== user.id) {
      return fail("CONFLICT", "Email already in use!");
    }

    const verificationToken = await generateVerificationToken(values.email);
    // Zmiana adresu zapisuje się mimo nieudanej wysyłki — użytkownik dostaje o tym informację.
    emailSent = await sendVerificationEmail(verificationToken.email, verificationToken.token, await getClientIp());

    // Tu dzieje się magia: aktualizujemy maila i zerujemy datę weryfikacji
    updateData.email = values.email;
    updateData.emailVerified = null; 
  }

  // 4. Logika zmiany HASŁA
  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(values.password, dbUser.password);
    if (!passwordsMatch) return fail("INVALID_INPUT", "Password incorrect!");

    const hashedPassword = await bcrypt.hash(values.newPassword, 12);
    updateData.password = hashedPassword;
  }

  // 5. Aktualizacja w bazie
  await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...updateData,
    }
  });

  revalidatePath("/dashboard/profile");
  
  return ok({ emailChanged: updateData.emailVerified === null, emailSent });
};