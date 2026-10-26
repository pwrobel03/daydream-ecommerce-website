// auth.ts
import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./lib/db"
import authConfig from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { LoginSchema } from "./schemas"
import { getUserByEmail } from "./data/user"
import { normalizeEmail } from "./lib/email"
import { getUserById } from "./data/user"
import bcrypt from "bcrypt" // or bcryptjs if you installed that
import { getAccountByUserId } from "./data/account"
import { clientIpFromHeaders, isRateLimited, rateLimit } from "./lib/rate-limit"

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited"
}

const LOGIN_WINDOW_SECONDS = 15 * 60

// Limity siedzą tutaj, a nie w akcji `login`: bezpośredni POST na
// /api/auth/callback/credentials omija akcję, ale nie omija authorize().
export async function authorizeCredentials(credentials: Partial<Record<string, unknown>>, request: Request) {
  const ip = clientIpFromHeaders(request.headers)
  // Limit na IP liczy każdą próbę i ogranicza przechodzenie po wielu kontach.
  const ipLimit = await rateLimit(`login:ip:${ip}`, 20, LOGIN_WINDOW_SECONDS)
  if (!ipLimit.allowed) throw new RateLimitedSignin()

  const validatedFields = LoginSchema.safeParse(credentials)
  if (!validatedFields.success) return null

  const { email, password } = validatedFields.data
  // Limit na konto liczy tylko nieudane próby, z dowolnego IP.
  const emailKey = `login:email:${email.toLowerCase()}`
  if (await isRateLimited(emailKey, 5)) throw new RateLimitedSignin()

  const user = await getUserByEmail(email)
  if (user?.password && (await bcrypt.compare(password, user.password))) return user

  await rateLimit(emailKey, 5, LOGIN_WINDOW_SECONDS)
  return null
}

export const jwt: NonNullable<NonNullable<NextAuthConfig["callbacks"]>["jwt"]> = async ({ token, trigger, session }) => {
  // Jeśli brak sub (ID użytkownika), nie przetwarzamy tokena
  if (!token.sub) return token;

  // Obsługa ręcznej aktualizacji sesji (np. zmiana nazwy profilu przez użytkownika).
  // Dane z update() pochodzą od klienta: przepisujemy tylko nazwę, nigdy rolę ani e-mail.
  if (trigger === "update" && session) {
    if (typeof session.name === "string") token.name = session.name;
    return token;
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
}

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

  jwt,

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
  adapter: (() => {
    const adapter = PrismaAdapter(db)
    return {
      ...adapter,
      // OAuth profiles carry the address as the provider spells it.
      createUser: (user) => adapter.createUser!({ ...user, email: normalizeEmail(user.email) }),
      getUserByEmail: (email) => adapter.getUserByEmail!(normalizeEmail(email)),
    }
  })(),
  session: { strategy: "jwt" },
  ...authConfig, // Inherit basic config
  providers: [
    ...authConfig.providers, // Spread existing providers (like Google/GitHub)
    Credentials({
      authorize: authorizeCredentials
    })
  ]
})