import { db } from "@/lib/db";

// Function to get a verification token by email
export const getVerificationTokenByToken = async (token: string) => {
  try {
    // Find the verification token in the database
    const verificationToken = await db.verificationToken.findUnique({
      where: {token}
    })
    return verificationToken || null
  } catch {
    return null
  }
}

// Function to get verification token by email
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    // Find the verification token in the database
    const verificationToken = await db.verificationToken.findFirst({
      where: {email}
    })
    return verificationToken || null
  } catch {
    return null
  }
}