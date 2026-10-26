import { defineConfig, devices } from "@playwright/test";

// Osobna konfiguracja dla listy kontrolnej Stripe (tests/stripe). `npm run test:e2e`
// używa playwright.config.ts i tych testów nie widzi. Klucze Stripe i adresy usług
// przychodzą z workflow stripe-checklist.yml; reszta jak w playwright.config.ts.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/stripe",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "stripe-results.json" }]],
  timeout: 180_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      UPLOAD_DIR: "./storage/uploads-e2e",
      REDIS_URL: process.env.REDIS_URL!,
      AUTH_SECRET: "e2e-auth-secret-value",
      AUTH_URL: BASE_URL,
      AUTH_TRUST_HOST: "true",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
      SMTP_HOST: "localhost",
      SMTP_PORT: "51025",
      SMTP_SECURE: "false",
      MAIL_FROM: "Daydream <test@example.com>",
      MAIL_DAILY_LIMIT: "100000",
      MAIL_HOURLY_LIMIT_PER_ADDRESS: "100000",
      MAIL_HOURLY_LIMIT_PER_IP: "100000",
      PRIVACY_CONTROLLER_NAME: "E2E Controller Ltd",
      PRIVACY_CONTACT_EMAIL: "privacy@example.com",
      PRIVACY_EMAIL_PROVIDER: "E2E SMTP Provider",
      CRON_SECRET: process.env.CRON_SECRET!,
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      NEXT_PUBLIC_APP_URL: BASE_URL,
    },
  },
});
