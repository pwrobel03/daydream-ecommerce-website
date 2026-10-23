"use server"

import {db} from "@/lib/db"
import { getUserByEmail } from "@/data/user"
import { getVerificationTokenByToken } from "@/data/verification-token"
import { ActionResult, fail, ok } from "@/lib/action-result";

export const newVerification = async (token: string): Promise<ActionResult> => {
  // Retrieve the verification token from the database
  const verificationToken = await getVerificationTokenByToken(token)
  if (!verificationToken) {
    return fail("NOT_FOUND", "Invalid verification token.")
  }

  // Check if the token has expired
  const hasExpired = verificationToken.expires < new Date();
  if (hasExpired) {
    return fail("NOT_FOUND", "Verification token has expired.")
  }

  // Get the user associated with the verification token
  const user = await getUserByEmail(verificationToken.email)
  if (!user) {
    return fail("NOT_FOUND", "Email doesn't associate with any user.")
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
  return ok()
}