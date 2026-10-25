"use server";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { ActionResult, fail, ok } from "@/lib/action-result";

export const login = async (
  values: z.infer<typeof LoginSchema>
): Promise<ActionResult> => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) return fail("INVALID_INPUT", "Invalid fields!");

  // Hasło i limity prób sprawdza dopiero authorize() w auth.ts, wołane przez
  // `signIn` po stronie klienta; tutaj potrzebny jest wyłącznie e-mail.
  const { email } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return fail("INVALID_INPUT", "Invalid credentials!");
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);
    const sent = await sendVerificationEmail(verificationToken.email, verificationToken.token, ip);
    if (!sent) return fail("EMAIL_NOT_SENT", "We could not send the e-mail right now. Try again later.");
    return fail("FORBIDDEN", "Email not verified! New email sent.");
  }
  return ok();
};