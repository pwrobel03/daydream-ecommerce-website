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
import { getAccountByUserId } from "./data/account"
import { log } from "console"

export const { auth, handlers, signIn, signOut } = NextAuth({
  //TODO: sign in with credentials
  pages: {
    signIn: "/auth/login",
    error: "/auth/error" // Error code passed in query string as ?error= 
  },
  events: {
    async linkAccount({user}) {
      await db.user.update({
        where: {id: user.id},
        data: {emailVerified: new Date()} // Mark email as verified when linking account
      })
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // If there's no user ID, block sign-in
      if (!user.id) return false
      // If the provider is not credentials, allow sign-in
      if (account?.provider !== "credentials") return true
      // For credentials provider, check if email is verified
      const existingUser = await getUserById(user.id)
      if (existingUser && !existingUser.emailVerified) return false // Block sign-in if email not verified
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role
      }

      if (session.user && token.name) {
        session.user.name = token.name
      }

      if (session.user && token.email) {
        session.user.email = token.email
      }

      if (session.user) {
        console.log(token);
        session.user.isOAuth = token.isOAuth as boolean
      }
      return session
    },
    async jwt({ token, trigger, session}) {
      if (!token.sub) return token

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      const existingUser = await getUserById(token.sub)
      if (!existingUser) return token

      const existingAccount = await getAccountByUserId(existingUser.id)


      token.name = existingUser.name
      token.email = existingUser.email
      token.role = existingUser.role
      token.isOAuth = !!existingAccount
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