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
  async signIn({ user, account }) {
    // 1. Blokada logowania bez ID
    if (!user.id) return false;

    // 2. OAuth przechodzi bez dodatkowej weryfikacji maila (zazwyczaj zweryfikowane u dostawcy)
    if (account?.provider !== "credentials") return true;

    // 3. Weryfikacja adresu email dla metody Credentials
    const existingUser = await getUserById(user.id);
    if (existingUser && !existingUser.emailVerified) return false;

    return true;
  },

  async jwt({ token, trigger, session }) {
    // Jeśli brak sub (ID użytkownika), nie przetwarzamy tokena
    if (!token.sub) return token;

    // Obsługa ręcznej aktualizacji sesji (np. zmiana nazwy profilu przez użytkownika)
    if (trigger === "update" && session) {
      return { ...token, ...session };
    }

    // POBIERANIE ŚWIEŻYCH DANYCH Z BAZY
    const existingUser = await getUserById(token.sub);
    
    // KLUCZOWE: Jeśli użytkownik został usunięty z bazy, czyścimy token.
    // Auth.js traktuje null jako unieważnienie sesji.
    if (!existingUser) {
      return null;
    }

    const existingAccount = await getAccountByUserId(existingUser.id);

    // Synchronizacja danych z bazy do tokena (zawsze aktualne role i dane)
    token.name = existingUser.name;
    token.email = existingUser.email;
    token.role = existingUser.role;
    token.isOAuth = !!existingAccount;

    return token;
  },

  async session({ session, token }) {
    // Unieważnianie sesji dla usuniętego użytkownika odbywa się w callbacku `jwt`,
    // który zwraca null. Tutaj wyłącznie mapujemy token na sesję — powtórne
    // odpytywanie bazy dokładało trzecie zapytanie do każdego odczytu sesji,
    // a `session` i tak nie może zwrócić null (§2.5 raportu).
    if (session.user) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role;
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      
      session.user.isOAuth = !!token.isOAuth;
    }

    return session;
  },
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