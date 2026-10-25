// lib/rate-limit.ts
import Redis from "ioredis";
import { env } from "@/lib/env";
import { reportError } from "@/lib/logger";

// Jedno połączenie na proces. W dev Next przeładowuje moduły przy każdej zmianie,
// więc trzymamy instancję na globalThis, żeby nie mnożyć połączeń.
const globalForRedis = globalThis as unknown as { redis?: Redis };

const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    // Kolejka offline musi zostać włączona: ioredis łączy się asynchronicznie,
    // więc przy `false` pierwsze polecenie po starcie leci, zanim połączenie
    // wstanie, i zawsze kończy się błędem "Stream isn't writeable" — co przy
    // fail-open po cichu wyłączało limitowanie. Kolejkę ogranicza czasowo
    // connectTimeout, więc akcja nie wisi, gdy Redisa naprawdę nie ma.
    enableOfflineQueue: true,
    connectTimeout: 3000,
  });

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;

redis.on("error", (error) => {
  reportError(error, { area: "rate-limit.redis" });
});

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Licznik w oknie stałym: pierwszy INCR zakłada klucz i ustawia mu TTL,
 * kolejne tylko zwiększają wartość, aż klucz wygaśnie.
 *
 * Zachowanie przy niedostępnym Redisie jest **fail-open** — przepuszczamy żądanie
 * i logujemy błąd. Awaria Redisa nie może wyłączyć logowania w całym sklepie;
 * ceną jest brak ochrony przed brute-force w oknie awarii. Limit maili wybiera
 * `failClosed` (ADR 0012): lepiej nie wysłać maila niż otworzyć nadawcę spamu.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options: { failClosed?: boolean } = {}
): Promise<RateLimitResult> {
  try {
    const redisKey = `rl:${key}`;
    const hits = await redis.incr(redisKey);

    if (hits === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    if (hits > limit) {
      const ttl = await redis.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { allowed: true, remaining: limit - hits, retryAfterSeconds: 0 };
  } catch (error) {
    // Fail-open bez sygnału jest niewykrywalny: limitowanie przestaje działać,
    // a wszystko wygląda normalnie. Zgłaszamy to jako błąd, nie jako szum.
    reportError(error, {
      area: options.failClosed ? "rate-limit.failed-closed" : "rate-limit.failed-open",
      key,
    });
    if (options.failClosed) {
      return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
    }
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Adres klienta na potrzeby kluczy licznika. Czytamy tylko X-Real-IP, który proxy
 * ustawia z adresu połączenia (X-Forwarded-For jest podrabialny).
 * Każde reverse proxy przed aplikacją musi nadpisywać X-Real-IP adresem klienta —
 * inaczej wartość kontroluje klient.
 * Limity opieramy dodatkowo na adresie e-mail.
 */
export function clientIpFromHeaders(headers: Headers): string {
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Wersja dla Server Actions, które nie dostają obiektu żądania. */
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");

  return clientIpFromHeaders(await headers());
}
