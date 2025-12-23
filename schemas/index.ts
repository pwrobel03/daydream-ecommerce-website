// schemas are defined using Zod
// helps to validate and infer types inside forms and actions
import { UserRole } from '@prisma/client';
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

// Schema for reset password
export const ResetPasswordSchema = z.object({
  email: z.string().email({
  message: "Email is required"
  })
})

// Schema for new password
export const NewPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Minimum password length is 8 characters"
  }),
  confirmPassword: z.string().min(8, {
    message: "Minimum password length is 8 characters"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // set the path of the error to confirmPassword field
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

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(8)),
  newPassword: z.optional(z.string().min(8))
}).refine((data) => {
  if (data.password && !data.newPassword) {
    return false
  }

  return true
}, {
  message: "New password is required",
  path: ["newPassword"]
}).refine((data) => {
  if (!data.password && data.newPassword) {
    return false
  }

  return true
}, {
  message: "Password is required",
  path: ["password"]
})

export const ReviewSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string().min(3, "You're story is a little too short..."),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().optional(),
  isSubcategory: z.boolean().default(false),
  parentId: z.string().optional(),
  image: z.any().optional(), // Tu trafi plik
});

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  promoPrice: z.string().optional(),
  weight: z.string().optional(),
  stock: z.coerce.number().min(0),
  statusId: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  ingredientIds: z.array(z.string()).default([]),
});