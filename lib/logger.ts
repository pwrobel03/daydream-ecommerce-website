// lib/logger.ts
import pino from "pino";
import { env } from "@/lib/env";

// JSON na stdout — kontener oddaje logi Dockerowi, a stamtąd bierze je
// dowolny kolektor. Bez usługi zewnętrznej i bez konfiguracji po stronie kodu.
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: undefined, // bez pid i hostname — w kontenerze to szum
  redact: {
    paths: ["password", "*.password", "token", "*.token", "authorization"],
    censor: "[redacted]",
  },
});

/**
 * Jedyne miejsce, przez które kod aplikacji zgłasza błędy.
 *
 * Dzięki temu podpięcie zewnętrznego trackera (Sentry lub innego) to zmiana
 * w jednej funkcji, a nie w kilkudziesięciu wywołaniach rozsianych po akcjach.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> & { area: string }
) {
  logger.error(
    { err: error instanceof Error ? error : new Error(String(error)), ...context },
    context.area
  );
}
