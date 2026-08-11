// lib/action-result.ts

/**
 * Kod błędu zwracany przez Server Action.
 *
 * Kod, nie sam tekst: interfejs może reagować różnie na `OUT_OF_STOCK`
 * (odśwież koszyk) i `INTERNAL` (pokaż komunikat), a tekst i tak jest
 * tłumaczony i nie nadaje się do porównywania.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "OUT_OF_STOCK"
  | "INVALID_COUPON"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "INTERNAL";

/**
 * Wynik mutacji wykonywanej przez Server Action.
 *
 * Unia rozróżniana po `ok`, więc TypeScript zawęża typ po sprawdzeniu:
 * po `if (!res.ok) return` `res.data` jest dostępne, a `res.message` nie.
 * Wcześniej akcje zwracały pięć niekompatybilnych kształtów i wywołujący
 * musiał znać każdą z osobna.
 *
 * Odczyty (`getCategories`, `getVoices`, …) celowo tego nie używają —
 * zwracają dane, nie wynik operacji.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | void> {
  return { ok: true, data: data as T };
}

export function fail(code: ErrorCode, message: string): ActionResult<never> {
  return { ok: false, code, message };
}


/**
 * Błąd niosący kod `ErrorCode`.
 *
 * Potrzebny tam, gdzie miejsce wykrycia błędu jest oddzielone od miejsca
 * zwrócenia wyniku — wnętrze transakcji Prismy albo guard w `lib/guards.ts`
 * nie może zwrócić `ActionResult`, może tylko rzucić. Zwykły `Error` gubił
 * przy tym kod i wszystko lądowało jako `INTERNAL`.
 */
export class ActionError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * Zamienia złapany wyjątek na `ActionResult`, zachowując kod z `ActionError`.
 * Nieznane błędy dostają `fallback`, bo ich komunikat może pochodzić z
 * biblioteki i nie nadaje się do pokazania użytkownikowi.
 */
export function failFrom(
  error: unknown,
  fallbackCode: ErrorCode,
  fallbackMessage: string
): ActionResult<never> {
  return error instanceof ActionError
    ? fail(error.code, error.message)
    : fail(fallbackCode, fallbackMessage);
}
