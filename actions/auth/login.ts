"use server";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Invalid fields!" };

  const { email, password } = validatedFields.data;

  // Limit na parę e-mail + IP: chroni pojedyncze konto przed zgadywaniem hasła
  // i nie pozwala jednemu adresowi rozjechać się po wielu kontach naraz.
  const ip = await getClientIp();
  const limit = await rateLimit(`login:${email}:${ip}`, 5, 15 * 60);
  if (!limit.allowed) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
    };
  }
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Invalid credentials!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
    return { error: "Email not verified! New email sent." };
  }
  return { success: true }; 
};