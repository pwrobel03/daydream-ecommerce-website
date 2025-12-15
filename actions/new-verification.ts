"use server"

import {db} from "@/lib/db"
import { getUserByEmail } from "@/data/user"
import { getVerificationTokenByToken } from "@/data/verification-token"

export const newVerification = async (token: string) => {
  // Retrieve the verification token from the database
  const verificationToken = await getVerificationTokenByToken(token)
  if (!verificationToken) {
    return { error: "Invalid verification token." }
  }

  // Check if the token has expired
  const hasExpired = verificationToken.expires < new Date();
  if (hasExpired) {
    return { error: "Verification token has expired." }
  }

  // Get the user associated with the verification token
  const user = await getUserByEmail(verificationToken.email)
  if (!user) {
    return { error: "User not found." }
  }

  // Update user's email verification status
  await db.user.update({
    where: { id: user.id },
    data: { 
      emailVerified: new Date(),
      email: verificationToken.email 
    }
  })

  // Delete the used verification token
  await db.verificationToken.delete({
    where: { id: verificationToken.id }
  })
  return { success: "Email successfully verified!" }
}