"use server"
import * as z from "zod"
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export const newPassword = async (values: z.infer<typeof NewPasswordSchema>, token: string) => {
  if (!token) return { error: "Missing password reset token"}
  // Validate input fields based on NewPasswordSchema
  const validatedFields = NewPasswordSchema.safeParse(values)
  if (!validatedFields.success) return { error: "Invalid fields!"}

  // Extract password from validated data
  const {password} = validatedFields.data
  const existingToken = await getPasswordResetTokenByToken(token)
  if (!existingToken) return { error: "Invalid or expired password reset token"}

  // Check if the token has expired
  const hasExpired = existingToken.expires < new Date()
  if (hasExpired) return { error: "Password reset token has expired"}

  // Get the user associated with the token's email
  const existingUser = await getUserByEmail(existingToken.email)
  if (!existingUser || !existingUser.id) return { error: "No user associated with this token"}

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
  return {success: "Your password has been successfully updated!"}
}