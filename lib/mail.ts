import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `http://localhost:3000/auth/new-password?token=${token}`

  await resend.emails.send({
    from: process.env.MAILING_ACCOUNT_PROVIDER!,
    to: process.env.MAILING_ACCOUNT!,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  });
}

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `http://localhost:3000/auth/new-verification?token=${token}`

  await resend.emails.send({
    from: process.env.MAILING_ACCOUNT_PROVIDER!,
    to: process.env.MAILING_ACCOUNT!,
    subject: "Verify your email address",
    html: `
      <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  });
}