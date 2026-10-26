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
  // AUTH_GOOGLE_* i AUTH_GITHUB_* są opcjonalne: dostawca jest rejestrowany tylko
  // wtedy, gdy ustawiono oba klucze pary (auth.config.ts). Niekompletna para to błąd.
  AUTH_SECRET: z.string().min(1, {
    message: "AUTH_SECRET jest wymagany (wygeneruj: npx auth secret)"
  }),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_GITHUB_ID: z.string().min(1).optional(),
  AUTH_GITHUB_SECRET: z.string().min(1).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().regex(/^[sr]k_test_/, {
    message: "STRIPE_SECRET_KEY musi zaczynać się od 'sk_test_' lub 'rk_test_' (ADR 0005: tylko tryb testowy)"
  }),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", {
    message: "STRIPE_WEBHOOK_SECRET musi zaczynać się od 'whsec_'"
  }),

  // Poczta wychodząca (SMTP)
  // W demo wskazuje na Mailpit z compose, na produkcji na dowolny serwer SMTP.
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  // Puste przy Mailpicie, który nie wymaga uwierzytelnienia.
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().min(1),
  // Twarde limity wysyłki (ADR 0012), egzekwowane w sendEmail.
  MAIL_DAILY_LIMIT: z.coerce.number().int().positive().default(50),
  MAIL_HOURLY_LIMIT_PER_ADDRESS: z.coerce.number().int().positive().default(3),
  MAIL_HOURLY_LIMIT_PER_IP: z.coerce.number().int().positive().default(3),

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

  // Cloudflare Turnstile. Klucz strony trafia do przeglądarki przez prop z Server
  // Componentu (czytany w runtime), sekret służy tylko do siteverify.
  TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Strona /privacy (ADR 0013): dane administratora i dostawcy poczty wpisuje
  // właściciel przy wdrożeniu, bez przebudowy obrazu.
  PRIVACY_CONTROLLER_NAME: z.string().min(1),
  PRIVACY_CONTACT_EMAIL: z.string().email(),
  PRIVACY_EMAIL_PROVIDER: z.string().min(1),

  // Publiczne
  NEXT_PUBLIC_APP_URL: z.string().url({
    message: "NEXT_PUBLIC_APP_URL musi być pełnym URL-em, np. http://localhost:3000"
  }),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).superRefine((data, ctx) => {
  for (const provider of ["GOOGLE", "GITHUB"] as const) {
    const id = `AUTH_${provider}_ID` as const;
    const secret = `AUTH_${provider}_SECRET` as const;
    if (!data[id] !== !data[secret]) {
      const missing = data[id] ? secret : id;
      ctx.addIssue({
        code: "custom",
        path: [missing],
        message: `${missing} jest wymagany, gdy ustawiono ${data[id] ? id : secret} (para ID i SECRET musi być kompletna)`,
      });
    }
  }
});

// ADR 0005: żaden klucz live nie może trafić do aplikacji, w żadnej zmiennej.
// Komunikat zawiera wyłącznie nazwę zmiennej, nigdy wartość.
const LIVE_KEY = /^(sk|rk|pk)_live_/;
const liveKeyVars = Object.entries(process.env)
  .filter(([, value]) => value !== undefined && LIVE_KEY.test(value))
  .map(([name]) => name);

if (liveKeyVars.length > 0) {
  throw new Error(
    `Wykryto klucz Stripe w trybie live w zmiennych: ${liveKeyVars.join(", ")}. Aplikacja działa wyłącznie w trybie testowym (ADR 0005).`
  );
}

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

// Klucze schematu; test tests/unit/env-reference.test.ts pilnuje, by każdy był w docs/*/environment.md.
export const ENV_KEYS = Object.keys(EnvSchema.shape);
