// lib/turnstile.ts
// Weryfikacja tokenu Cloudflare Turnstile po stronie serwera. Tylko kod serwerowy.
import { env } from "@/lib/env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

/**
 * Zwraca `true` tylko wtedy, gdy Cloudflare potwierdził token. Brak tokenu,
 * odrzucenie, timeout i błąd sieci dają `false` (fail closed) — akcja ma wtedy
 * niczego nie tworzyć ani nie wysyłać.
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
