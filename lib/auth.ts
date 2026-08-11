import { getSession } from "@/lib/session"

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user || null;
}

export const getCurrentRole = async () => {
  const session = await getSession()
  return session?.user?.role
}