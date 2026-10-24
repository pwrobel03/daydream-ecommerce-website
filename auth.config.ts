// auth.config.ts
import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { env } from "./lib/env"

type OAuthEnv = Pick<
  typeof env,
  "AUTH_GITHUB_ID" | "AUTH_GITHUB_SECRET" | "AUTH_GOOGLE_ID" | "AUTH_GOOGLE_SECRET"
>

// Dostawca jest zarejestrowany tylko wtedy, gdy ustawiono ID i secret.
// Niekompletną parę odrzuca już lib/env.ts.
export const oauthProviderIds = (e: OAuthEnv) => [
  ...(e.AUTH_GITHUB_ID && e.AUTH_GITHUB_SECRET ? (["github"] as const) : []),
  ...(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET ? (["google"] as const) : []),
]

// Auth.js v5 sam odczytuje AUTH_GITHUB_ID/SECRET i AUTH_GOOGLE_ID/SECRET,
// więc nie przekazujemy kluczy ręcznie.
export default {
  providers: oauthProviderIds(env).map((id) => (id === "github" ? GitHub : Google)),
} satisfies NextAuthConfig
