// tests/test-env.ts
// Wspólny zestaw zmiennych dla wszystkich konfiguracji testowych.
// lib/env.ts waliduje konfigurację przy imporcie, więc każdy test dotykający
// kodu aplikacji potrzebuje kompletu wartości o poprawnym formacie.
// To wartości pozorne — nic tutaj nie łączy się z zewnętrznym serwisem.
export const testEnv = {
  AUTH_SECRET: "test-auth-secret",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_dummy",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_SECURE: "false",
  MAIL_FROM: "Daydream <test@example.com>",
  PRIVACY_CONTROLLER_NAME: "Test Controller",
  PRIVACY_CONTACT_EMAIL: "privacy@example.com",
  PRIVACY_EMAIL_PROVIDER: "Test SMTP Provider",
  UPLOAD_DIR: "./storage/uploads-test",
  REDIS_URL: "redis://localhost:6379",
  CRON_SECRET: "test-cron-secret-value",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};
