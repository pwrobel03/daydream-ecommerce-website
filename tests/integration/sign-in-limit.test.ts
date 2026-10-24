import { afterAll, beforeAll, beforeEach, describe, expect, inject, it, vi } from "vitest";
import bcrypt from "bcrypt";
import type { JWT } from "next-auth/jwt";

const { db } = await vi.hoisted(async () => {
  // lib/env.ts czyta REDIS_URL przy imporcie, więc adres kontenera musi być
  // ustawiony, zanim cokolwiek zaimportuje lib/rate-limit.ts.
  const { inject } = await import("vitest");
  process.env.REDIS_URL = inject("REDIS_URL");
  const { createPrismaClient } = await import("@/lib/db");
  return { db: createPrismaClient() };
});

vi.mock("@/lib/db", () => ({ db }));

const { authorizeCredentials, jwt } = await import("@/auth");
const { default: Redis } = await import("ioredis");

const redis = new Redis(inject("REDIS_URL"));
const EMAIL = "limit@example.com";
const PASSWORD = "correct-password";

function request(ip: string) {
  return new Request("http://localhost/api/auth/callback/credentials", {
    method: "POST",
    headers: { "x-real-ip": ip },
  });
}

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.user.create({
    data: { email: EMAIL, password: await bcrypt.hash(PASSWORD, 4), emailVerified: new Date() },
  });
});

afterAll(async () => {
  await db.$disconnect();
  redis.disconnect();
});

beforeEach(async () => {
  await redis.flushall();
});

describe("credentials sign-in limits", () => {
  it("refuses the 6th attempt for one e-mail after 5 failures from different IPs, even with the correct password", async () => {
    for (let i = 1; i <= 5; i++) {
      expect(await authorizeCredentials({ email: EMAIL, password: "wrong" }, request(`198.51.100.${i}`))).toBeNull();
    }

    await expect(
      authorizeCredentials({ email: EMAIL, password: PASSWORD }, request("198.51.100.6"))
    ).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("counts unknown accounts as failures and does not count successful sign-ins", async () => {
    const user = await authorizeCredentials({ email: EMAIL, password: PASSWORD }, request("198.51.100.1"));
    expect(user).toMatchObject({ email: EMAIL });

    for (let i = 0; i < 4; i++) {
      await authorizeCredentials({ email: EMAIL, password: "wrong" }, request("198.51.100.2"));
    }
    expect(await authorizeCredentials({ email: EMAIL, password: PASSWORD }, request("198.51.100.3"))).not.toBeNull();

    for (let i = 0; i < 5; i++) {
      await authorizeCredentials({ email: "nobody@example.com", password: "x" }, request("198.51.100.4"));
    }
    await expect(
      authorizeCredentials({ email: "nobody@example.com", password: "x" }, request("198.51.100.5"))
    ).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("refuses the 21st attempt from one IP across different accounts", async () => {
    for (let i = 1; i <= 20; i++) {
      expect(
        await authorizeCredentials({ email: `user${i}@example.com`, password: "x" }, request("203.0.113.9"))
      ).toBeNull();
    }

    await expect(
      authorizeCredentials({ email: EMAIL, password: PASSWORD }, request("203.0.113.9"))
    ).rejects.toMatchObject({ code: "rate_limited" });
  });
});

describe("jwt callback update", () => {
  it("copies only the name from client data", async () => {
    const token = { sub: "user-id", name: "old", email: EMAIL, role: "USER" } as JWT;

    const updated = await jwt({
      token,
      trigger: "update",
      session: { role: "ADMIN", name: "x", email: "evil@example.com" },
    } as Parameters<typeof jwt>[0]);

    expect(updated).toMatchObject({ name: "x", role: "USER", email: EMAIL });
  });
});
