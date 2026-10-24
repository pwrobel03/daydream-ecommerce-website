import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Wartości spójne z docker-compose.test.yml. Skrypt `npm run test:e2e`
// podnosi te usługi i wypycha schemat, zanim Playwright wystartuje serwer.
const E2E_ENV = {
  DATABASE_URL: "postgresql://daydream:daydream@localhost:55432/daydream_e2e",
  UPLOAD_DIR: "./storage/uploads-e2e",
  REDIS_URL: "redis://localhost:56379",
  AUTH_SECRET: "e2e-auth-secret-value",
  AUTH_URL: BASE_URL,
  AUTH_TRUST_HOST: "true",
  STRIPE_SECRET_KEY: "sk_test_e2e",
  STRIPE_WEBHOOK_SECRET: "whsec_e2e",
  SMTP_HOST: "localhost",
  SMTP_PORT: "51025",
  SMTP_SECURE: "false",
  MAIL_FROM: "Daydream <test@example.com>",
  // Cały zestaw E2E wysyła z jednego IP i kilku adresów — limity nie mogą go zatrzymać.
  MAIL_DAILY_LIMIT: "100000",
  MAIL_HOURLY_LIMIT_PER_ADDRESS: "100000",
  MAIL_HOURLY_LIMIT_PER_IP: "100000",
  PRIVACY_CONTROLLER_NAME: "E2E Controller Ltd",
  PRIVACY_CONTACT_EMAIL: "privacy@example.com",
  PRIVACY_EMAIL_PROVIDER: "E2E SMTP Provider",
  CRON_SECRET: "e2e-cron-secret-value",
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  NEXT_PUBLIC_APP_URL: BASE_URL,
};

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: E2E_ENV,
  },
});
