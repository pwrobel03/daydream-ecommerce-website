import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { env } from "@/lib/env";
import { reportError } from "@/lib/logger";

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
}

/**
 * Wysyła maila renderując komponent React Email do HTML.
 *
 * Nie rzuca: nieudana wysyłka nie może wywrócić rejestracji ani zapłaconego
 * zamówienia. Błąd trafia do logów, gdzie da się go zobaczyć i ponowić ręcznie.
 */
export async function sendEmail({ to, subject, template }: SendOptions) {
  try {
    const [html, text] = await Promise.all([
      render(template),
      render(template, { plainText: true }),
    ]);

    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
  } catch (error) {
    reportError(error, { area: "mail.send", to, subject });
  }
}

// --- Konkretne wiadomości ---------------------------------------------------

export async function sendVerificationEmail(to: string, token: string) {
  const { VerifyEmail } = await import("@/emails/verify-email");

  await sendEmail({
    to,
    subject: "Confirm your email address",
    template: VerifyEmail({
      url: `${env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const { ResetPassword } = await import("@/emails/reset-password");

  await sendEmail({
    to,
    subject: "Reset your password",
    template: ResetPassword({
      url: `${env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${token}`,
    }),
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  props: import("@/emails/order-confirmation").OrderConfirmationProps
) {
  const { OrderConfirmation } = await import("@/emails/order-confirmation");

  await sendEmail({
    to,
    subject: `Order confirmed — ${props.orderId}`,
    template: OrderConfirmation(props),
  });
}
