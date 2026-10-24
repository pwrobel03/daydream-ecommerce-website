import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { env } from "@/lib/env";
import { logger, reportError } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// Jedno połączenie na proces. W dev Next przeładowuje moduły przy każdej
// zmianie, więc instancja siedzi na globalThis.
const globalForMail = globalThis as unknown as {
  mailer?: nodemailer.Transporter;
};

const transporter =
  globalForMail.mailer ??
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    // Mailpit nie wymaga uwierzytelnienia; produkcyjny SMTP zwykle tak.
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  });

if (env.NODE_ENV !== "production") globalForMail.mailer = transporter;

interface SendOptions {
  to: string;
  subject: string;
  template: ReactElement;
  ip?: string;
}

/**
 * Wysyła maila renderując komponent React Email do HTML.
 *
 * Przed renderowaniem sprawdza trzy limity (ADR 0012): per IP, per adresat
 * i globalny. Limiter działa fail-closed — gdy Redis leży, nic nie wychodzi.
 * Bez `ip` (webhook) liczą się tylko limity globalny i adresata.
 *
 * Nie rzuca: nieudana wysyłka nie może wywrócić rejestracji ani zapłaconego
 * zamówienia. Błąd trafia do logów, gdzie da się go zobaczyć i ponowić ręcznie.
 * Zwraca, czy wiadomość wyszła, żeby wywołujący mógł powiedzieć o tym użytkownikowi.
 */
async function sendEmail({ to, subject, template, ip }: SendOptions): Promise<boolean> {
  // Najwęższy limit pierwszy: odmowa nie zużywa wtedy puli globalnej.
  const checks = [
    ...(ip ? [{ name: "ip", key: `mail:ip:${ip}`, limit: env.MAIL_HOURLY_LIMIT_PER_IP, window: 3600 }] : []),
    { name: "address", key: `mail:to:${to.toLowerCase()}`, limit: env.MAIL_HOURLY_LIMIT_PER_ADDRESS, window: 3600 },
    { name: "global", key: "mail:global", limit: env.MAIL_DAILY_LIMIT, window: 24 * 3600 },
  ];
  for (const check of checks) {
    const result = await rateLimit(check.key, check.limit, check.window, { failClosed: true });
    if (!result.allowed) {
      logger.warn({ area: "mail.limit", limit: check.name, to, subject }, "E-mail not sent: limit reached");
      return false;
    }
  }

  try {
    const [html, text] = await Promise.all([
      render(template),
      render(template, { plainText: true }),
    ]);

    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
    return true;
  } catch (error) {
    reportError(error, { area: "mail.send", to, subject });
    return false;
  }
}

// --- Konkretne wiadomości ---------------------------------------------------

export async function sendVerificationEmail(to: string, token: string, ip?: string): Promise<boolean> {
  const { VerifyEmail } = await import("@/emails/verify-email");

  return sendEmail({
    to,
    subject: "Confirm your email address",
    ip,
    template: VerifyEmail({
      url: `${env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, token: string, ip?: string): Promise<boolean> {
  const { ResetPassword } = await import("@/emails/reset-password");

  return sendEmail({
    to,
    subject: "Reset your password",
    ip,
    template: ResetPassword({
      url: `${env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${token}`,
    }),
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  props: import("@/emails/order-confirmation").OrderConfirmationProps
): Promise<boolean> {
  const { OrderConfirmation } = await import("@/emails/order-confirmation");

  return sendEmail({
    to,
    subject: `Order confirmed — ${props.orderId}`,
    template: OrderConfirmation(props),
  });
}
