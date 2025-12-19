"use server"
import * as z from "zod"
import { SettingsSchema } from "@/schemas"
import { getCurrentUser } from "@/lib/auth"
import { getUserById, getUserByEmail } from "@/data/user"
import { db } from "@/lib/db"
import { generateVerificationToken } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/mail"
import { revalidatePath } from "next/cache"
import bcrypt from "bcrypt"

// actions/settings.ts
export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await getCurrentUser();
  if (!user || !user.id) return { error: "Unauthorized!" };

  const dbUser = await getUserById(user.id);
  if (!dbUser) return { error: "User not found!" };

  // 1. Kopiujemy dane z formularza do obiektu, który trafi do bazy
  // TypeScript pozwoli nam dodać tu pola z modelu Prisma
  const updateData: any = {
    name: values.name,
  };

  // 2. Obsługa OAuth (blokada zmian wrażliwych)
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
  }

  // 3. Logika zmiany EMAIL (Natychmiastowa zmiana + cofnięcie weryfikacji)
  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    // Tu dzieje się magia: aktualizujemy maila i zerujemy datę weryfikacji
    updateData.email = values.email;
    updateData.emailVerified = null; 
  }

  // 4. Logika zmiany HASŁA
  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(values.password, dbUser.password);
    if (!passwordsMatch) return { error: "Password incorrect!" };

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

  revalidatePath("/settings");
  
  if (updateData.emailVerified === null) {
      return { success: "Email updated & verification link sent!" };
  }

  return { success: "Settings updated!" };
};