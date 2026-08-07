// lib/rate-limit.ts
import Redis from "ioredis";
import { env } from "@/lib/env";

// Jedno połączenie na proces. W dev Next przeładowuje moduły przy każdej zmianie,
// więc trzymamy instancję na globalThis, żeby nie mnożyć połączeń.
const globalForRedis = globalThis as unknown as { redis?: Redis };

const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    // Bez tego ioredis kolejkuje polecenia w nieskończoność, gdy Redis nie odpowiada,
    // i akcja logowania wisi zamiast szybko zwrócić wynik.
    enableOfflineQueue: false,
    lazyConnect: true,
  });

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;

redis.on("error", (error) => {
  console.error("Rate limit Redis error:", error.message);
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
 * ceną jest brak ochrony przed brute-force w oknie awarii.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
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
    console.error("Rate limit check failed, allowing request:", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Adres klienta na potrzeby kluczy licznika. Server Actions nie dostają obiektu
 * żądania, więc czytamy nagłówki proxy. Wartość jest pomocnicza — łatwo ją
 * podrobić, dlatego limity opieramy dodatkowo na adresie e-mail.
 */
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const headerList = await headers();

  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return headerList.get("x-real-ip") ?? "unknown";
}
