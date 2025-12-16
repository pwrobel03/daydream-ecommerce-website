"use server"
import * as z from "zod"
import { ResetPasswordSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

export const resetPassword = async (values: z.infer<typeof ResetPasswordSchema>) => {
  // Validate input fields based on ResetPasswordSchema
  const validatedFields = ResetPasswordSchema.safeParse(values)
  if (!validatedFields.success) return { error: "Invalid fields!"}

  // Extract email from validated data
  const {email} = validatedFields.data
  const existingUser = await getUserByEmail(email)

  // Check if user exists
  if (!existingUser) return { error: "No account associated with this email"}

  // Here you would typically generate a password reset token and send an email
  // For simplicity, we will just return a success message
  // TODO: Implement token generation and email sending logic
  return {success: "Password reset link has been sent to your email!"}
} 