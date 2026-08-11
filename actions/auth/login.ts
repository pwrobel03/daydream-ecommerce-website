"use server";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ActionResult, fail, ok } from "@/lib/action-result";

export const login = async (
  values: z.infer<typeof LoginSchema>
): Promise<ActionResult> => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) return fail("INVALID_INPUT", "Invalid fields!");

  // Hasło sprawdza dopiero `signIn` po stronie klienta; tutaj potrzebny
  // jest wyłącznie e-mail do limitu prób i wyszukania konta.
  const { email } = validatedFields.data;

  // Limit na parę e-mail + IP: chroni pojedyncze konto przed zgadywaniem hasła
  // i nie pozwala jednemu adresowi rozjechać się po wielu kontach naraz.
  const ip = await getClientIp();
  const limit = await rateLimit(`login:${email}:${ip}`, 5, 15 * 60);
  if (!limit.allowed) {
    return fail(
      "RATE_LIMITED",
      `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`
    );
  }
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return fail("INVALID_INPUT", "Invalid credentials!");
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
    return fail("FORBIDDEN", "Email not verified! New email sent.");
  }
  return ok();
};