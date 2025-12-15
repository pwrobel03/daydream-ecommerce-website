"use server";
import * as z from "zod"

import { AuthError } from "next-auth";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateVerificationToken } from "@/lib/token";
import { getUserByEmail } from "@/data/user";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  // Validate input fields based on LoginSchema
  const validatedFields = LoginSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: "Invalid fields!"}
  }

  // Extract email and password
  const {email, password} = validatedFields.data
  const existingUser = await getUserByEmail(email)

  // Check if user exists and is verified
  if (!existingUser || !existingUser.email || !existingUser.password ) {
    return { error: "Invalid credentials!"}
  }

  // Check if email is verified
  // TODO: verification token now block login until email verified
  // in future, we will only block card shopping until email verified
  if (!existingUser.emailVerified) {
    // Generate a new verification token
    const verificationToken = await generateVerificationToken(existingUser.email)
    return { error: "Email not verified! A new verification email has been sent."}
  }

  // Proceed to sign in the user
  try {
    await signIn("credentials", {
      email, 
      password, 
      redirectTo: DEFAULT_LOGIN_REDIRECT
    })
    return {success: "email sent!"}
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": return {error: "Invalid credentials!"}
        default: return {error: "Something went wrong!"}
      }
    }
    throw error
  }
}