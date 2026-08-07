// auth.config.ts
import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

// providers for next-auth authentication services
// Auth.js v5 sam odczytuje AUTH_GITHUB_ID/SECRET i AUTH_GOOGLE_ID/SECRET,
// więc nie przekazujemy kluczy ręcznie. Walidacja zmiennych w lib/env.ts.
export default {
  providers: [GitHub, Google],
} satisfies NextAuthConfig
