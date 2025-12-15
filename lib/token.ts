import {v4 as uuid} from "uuid"
import { getVerificationTokenByEmail } from "@/data/verification-token"
import { db } from "./db"

// Function to generate a verification token
export const generateVerificationToken = async (email: string) => {
  // Implementation for generating a verification token
  const token = uuid()
  const expires = new Date(Date.now() + 30 * 60 * 1000) // Token valid for 30 minutes
  // Here you would typically save the token to the database associated with the email
  const existingToken = await getVerificationTokenByEmail(email)
  if (existingToken) {
    // Delete existing token before creating a new one
    await db.verificationToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  // Save the new token
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  })
  return verificationToken
}