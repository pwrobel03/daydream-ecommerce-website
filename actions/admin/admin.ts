"use server"
import { getCurrentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const admin = async () => {
  const role = await getCurrentRole()
  if (role === UserRole.ADMIN) return {success: "Allowed server action!"}
  return {error: "Forbidden server action!"}
}