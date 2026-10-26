"use server"
import * as z from "zod"
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/token";
import { ResetPasswordSchema } from "@/schemas";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { ActionResult, fail, ok } from "@/lib/action-result";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token: string
): Promise<ActionResult> => {
  if (!token) return fail("INVALID_INPUT", "Missing password reset token")
  // Validate input fields based on NewPasswordSchema
  const validatedFields = NewPasswordSchema.safeParse(values)
  if (!validatedFields.success) return fail("INVALID_INPUT", "Invalid fields!")

  // Extract password from validated data
  const {password} = validatedFields.data
  const existingToken = await getPasswordResetTokenByToken(token)
  if (!existingToken) return fail("NOT_FOUND", "Invalid or expired password reset token")

  // Check if the token has expired
  const hasExpired = existingToken.expires < new Date()
  if (hasExpired) return fail("NOT_FOUND", "Password reset token has expired")

  // Get the user associated with the token's email
  const existingUser = await getUserByEmail(existingToken.email)
  if (!existingUser || !existingUser.id) return fail("NOT_FOUND", "No user associated with this token")

  // Hash the new password and update the user's password in the database
  const hashedPassword = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword
    }
  })

  // Delete the used password reset token
  await db.passwordResetToken.deleteMany({
    where: { id: existingToken.id }
  })
  return ok()
}

export const resetPassword = async (
  values: z.infer<typeof ResetPasswordSchema>
): Promise<ActionResult> => {
  // Validate input fields based on ResetPasswordSchema
  const validatedFields = ResetPasswordSchema.safeParse(values)
  if (!validatedFields.success) return fail("INVALID_INPUT", "Invalid fields!")

  // Extract email from validated data
  const {email, turnstileToken} = validatedFields.data

  const ip = await getClientIp();
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return fail("TURNSTILE_FAILED", "Verification failed. Please try again.")
  }

  // Każde przejście wysyła maila — limit trzyma to poza zasięgiem automatu.
  const limit = await rateLimit(`reset:${email}:${ip}`, 3, 60 * 60);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many reset requests. Please try again later.");
  }

  const existingUser = await getUserByEmail(email)

  // Check if user exists
  if (!existingUser) return fail("NOT_FOUND", "No account associated with this email")

  // Generate password reset token and send email
  const passwordResetToken = await generatePasswordResetToken(email)
  const sent = await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token, ip)
  if (!sent) return fail("EMAIL_NOT_SENT", "We could not send the e-mail right now. Try again later.")
  return ok()
} 