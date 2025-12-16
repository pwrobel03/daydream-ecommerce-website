"use server"
import * as z from "zod"
import { ResetPasswordSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { send } from "process";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/token";

export const resetPassword = async (values: z.infer<typeof ResetPasswordSchema>) => {
  // Validate input fields based on ResetPasswordSchema
  const validatedFields = ResetPasswordSchema.safeParse(values)
  if (!validatedFields.success) return { error: "Invalid fields!"}

  // Extract email from validated data
  const {email} = validatedFields.data
  const existingUser = await getUserByEmail(email)

  // Check if user exists
  if (!existingUser) return { error: "No account associated with this email"}

  // Generate password reset token and send email
  const passwordResetToken = await generatePasswordResetToken(email)
  await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token)
  return {success: "Password reset link has been sent to your email!"}
} 