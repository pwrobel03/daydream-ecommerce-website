// lib/action-result.ts

/**
 * Wynik Server Action.
 *
 * Zastępuje `{ error: string }`, po którym nie dało się odróżnić „towar
 * niedostępny" od „padła baza" — a więc ani zareagować inaczej w interfejsie,
 * ani sensownie zalogować.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "OUT_OF_STOCK"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "INTERNAL";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, message: string): ActionResult<never> {
  return { ok: false, code, message };
}
