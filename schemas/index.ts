// schemas are defined using Zod
// helps to validate and infer types inside forms and actions
import * as z from 'zod';
// Schema for login
export const LoginSchema = z.object({
  email: z.string().email({
  message: "Email is required"
  }),
  password: z.string().min(1, {
  message: "Password is required"
  })
})

// New schema for reset password
export const ResetPasswordSchema = z.object({
  email: z.string().email({
  message: "Email is required"
  })
})

// Schema for registration
export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required"
  }),
  password: z.string().min(8, {
    message: "Minimum password length is 8 characters"
  }),
   name: z.string().min(1, {
    message: "Name is required"
  })
})