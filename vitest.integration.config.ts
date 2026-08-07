import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // Kontener startuje raz; testy dzielą bazę, więc muszą iść po kolei.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 180_000,
    // lib/env.ts waliduje wszystko przy imporcie — podstawiamy wartości w poprawnym
    // formacie, żeby import akcji nie wysypywał się na konfiguracji.
    env: {
      AUTH_SECRET: "test-auth-secret",
      AUTH_GOOGLE_ID: "test",
      AUTH_GOOGLE_SECRET: "test",
      AUTH_GITHUB_ID: "test",
      AUTH_GITHUB_SECRET: "test",
      STRIPE_SECRET_KEY: "sk_test_dummy",
      STRIPE_WEBHOOK_SECRET: "whsec_dummy",
      RESEND_API_KEY: "re_dummy",
      MAILING_ACCOUNT: "test@example.com",
      MAILING_ACCOUNT_PROVIDER: "onboarding@resend.dev",
      REDIS_URL: "redis://localhost:6379",
      CRON_SECRET: "test-cron-secret-value",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
