import {auth} from "@/auth"

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user || null;
}

export const getCurrentRole = async () => {
  const session = await auth()
  return session?.user?.role
}