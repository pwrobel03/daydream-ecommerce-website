import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/email";

// get password reset token by token string
export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token }
    });

    return resetToken || null;
  } catch {
    return null;
  }
};

// get password reset token by email
export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const resetToken = await db.passwordResetToken.findFirst({
      where: { email: normalizeEmail(email) }
    });

    return resetToken || null;
  } catch {
    return null;
  }
}