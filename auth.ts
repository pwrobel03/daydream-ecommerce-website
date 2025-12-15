// auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./lib/db"
import authConfig from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { LoginSchema } from "./schemas"
import { getUserByEmail } from "./data/user"
import { getUserById } from "./data/user"
import bcrypt from "bcrypt" // or bcryptjs if you installed that

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role
      }
      return session
    },
    async jwt({ token }) {
      if (!token.sub) return token
      const existingUser = await getUserById(token.sub)
      if (!existingUser) return token
      token.role = existingUser.role
      return token
    }
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig, // Inherit basic config
  providers: [
    ...authConfig.providers, // Spread existing providers (like Google/GitHub)
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data
          const user = await getUserByEmail(email)
          
          if (!user || !user.password) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) return user
        }
        return null
      }
    })
  ]
})