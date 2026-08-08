import { NextResponse } from "next/server";
import Redis from "ioredis";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { reportError } from "@/lib/logger";

// Sprawdza zależności, od których zależy działanie sklepu, a nie samo to,
// czy proces Node odpowiada — ten odpowiada także wtedy, gdy baza jest martwa.
export const dynamic = "force-dynamic";

async function checkDatabase() {
  await db.$queryRaw`SELECT 1`;
}

async function checkRedis() {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    await redis.ping();
  } finally {
    redis.disconnect();
  }
}

export async function GET() {
  const results = await Promise.allSettled([checkDatabase(), checkRedis()]);
  const [database, redis] = results.map((r) => r.status === "fulfilled");

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      reportError(result.reason, { area: "health", dependency: index === 0 ? "database" : "redis" });
    }
  }

  const healthy = database && redis;

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", database, redis },
    { status: healthy ? 200 : 503 }
  );
}
