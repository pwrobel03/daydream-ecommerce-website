import {v4 as uuid} from "uuid"
import { getVerificationTokenByEmail } from "@/data/verification-token"
import { db } from "./db"

// Function to generate a verification token
export const generateVerificationToken = async (email: string) => {
  const token = uuid()
  const expires = new Date(Date.now() + 30 * 60 * 1000) // Token valid for 30 minutes

  // Delete any existing verification tokens for this email
  await db.verificationToken.deleteMany({
    where: { email }
  })

  // Create a new verification token
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  })
  
  return verificationToken
}

// Function to generate a password reset token
export const generatePasswordResetToken = async (email: string) => {
  const token = uuid()
  const expires = new Date(Date.now() + 30 * 60 * 1000) // Token valid for 30 minutes

  // Delete any existing password reset tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email }
  })

  // Create a new password reset token
  const resetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  })

  return resetToken
}