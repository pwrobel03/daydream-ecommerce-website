"use server";
import * as z from "zod"
import bcrypt from "bcrypt"
import { db } from "@/lib/db";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ActionResult, fail, ok } from "@/lib/action-result";

export const register = async (
  values: z.infer<typeof RegisterSchema>
): Promise<ActionResult> => {
  const validatedFields = RegisterSchema.safeParse(values)
  if (!validatedFields.success) {
    return fail("INVALID_INPUT", "Invalid fields!")
  }

  const {email, password, name} = validatedFields.data

  // Rejestracja wysyła maila, więc limit chroni też przed użyciem formularza
  // jako darmowego nadajnika spamu przez Resend.
  const ip = await getClientIp();
  const limit = await rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many registration attempts. Please try again later.");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return fail("CONFLICT", "Email already in use!")
  }

  await db.user.create({
    data: {
      name, 
      email, 
      password: hashedPassword
    }
  })

  const verificationToken = await generateVerificationToken(email)
  const sent = await sendVerificationEmail(verificationToken.email, verificationToken.token, ip)
  // Konto już istnieje; późniejsze logowanie ponowi wysyłkę w ramach limitów.
  if (!sent) return fail("EMAIL_NOT_SENT", "We could not send the e-mail right now. Try again later.")
  return ok()
}