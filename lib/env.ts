// lib/env.ts
// Walidacja zmiennych środowiskowych przy starcie aplikacji.
// Dzięki temu brakujący lub pusty klucz wysypuje się z czytelnym komunikatem
// zamiast dawać `undefined` w środku żądania (non-null assertion `!`).
// Plik jest przeznaczony wyłącznie dla kodu serwerowego.
import * as z from 'zod';

const EnvSchema = z.object({
  // Baza danych
  DATABASE_URL: z.string().url({
    message: "DATABASE_URL musi być poprawnym connection stringiem PostgreSQL"
  }),

  // Auth.js
  // AUTH_GOOGLE_* i AUTH_GITHUB_* są wykrywane automatycznie przez Auth.js v5,
  // ale walidujemy je tutaj, żeby brak klucza nie objawiał się cichym 500 przy logowaniu.
  AUTH_SECRET: z.string().min(1, {
    message: "AUTH_SECRET jest wymagany (wygeneruj: npx auth secret)"
  }),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", {
    message: "STRIPE_SECRET_KEY musi zaczynać się od 'sk_'"
  }),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", {
    message: "STRIPE_WEBHOOK_SECRET musi zaczynać się od 'whsec_'"
  }),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_", {
    message: "RESEND_API_KEY musi zaczynać się od 're_'"
  }),
  MAILING_ACCOUNT: z.string().min(1),
  MAILING_ACCOUNT_PROVIDER: z.string().min(1),

  // Upload plików. Katalog musi leżeć poza public/ i być montowany jako wolumen,
  // inaczej wgrane zdjęcia znikają przy odtworzeniu kontenera.
  UPLOAD_DIR: z.string().min(1),

  // Redis (rate limiting)
  REDIS_URL: z.string().url({
    message: "REDIS_URL musi być poprawnym URL-em, np. redis://localhost:6379"
  }),

  // Zadania cykliczne
  CRON_SECRET: z.string().min(16, {
    message: "CRON_SECRET musi mieć co najmniej 16 znaków"
  }),

  // Publiczne
  NEXT_PUBLIC_APP_URL: z.string().url({
    message: "NEXT_PUBLIC_APP_URL musi być pełnym URL-em, np. http://localhost:3000"
  }),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Niepoprawna konfiguracja zmiennych środowiskowych:\n${details}\n\nSprawdź plik .env (wzór w .env.example).`
  );
}

export const env = parsed.data;
