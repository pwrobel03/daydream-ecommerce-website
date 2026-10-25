import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { db } = await vi.hoisted(async () => {
  // lib/env.ts czyta REDIS_URL przy imporcie, więc adres kontenera musi być
  // ustawiony, zanim cokolwiek zaimportuje lib/rate-limit.ts.
  const { inject } = await import("vitest");
  process.env.REDIS_URL = inject("REDIS_URL");
  const { createPrismaClient } = await import("@/lib/db");
  return { db: createPrismaClient() };
});

vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.50" }),
}));
vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));

const { register } = await import("@/actions/auth/register");
const { resetPassword } = await import("@/actions/auth/reset-password");
const { sendVerificationEmail, sendPasswordResetEmail } = await import("@/lib/mail");

const EMAIL = "turnstile@example.com";

afterAll(() => db.$disconnect());

beforeEach(async () => {
  await db.user.deleteMany({ where: { email: EMAIL } });
  vi.mocked(sendVerificationEmail).mockClear();
  vi.mocked(sendPasswordResetEmail).mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe("Turnstile on register and resetPassword", () => {
  it("creates no user and sends no e-mail when Cloudflare rejects the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false })));

    const res = await register({ name: "T", email: EMAIL, password: "password123", turnstileToken: "bad" });

    expect(res).toMatchObject({ ok: false, code: "TURNSTILE_FAILED" });
    expect(await db.user.count({ where: { email: EMAIL } })).toBe(0);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends no reset e-mail when Cloudflare is unreachable", async () => {
    await db.user.create({ data: { email: EMAIL, password: "x" } });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const res = await resetPassword({ email: EMAIL, turnstileToken: "token" });

    expect(res).toMatchObject({ ok: false, code: "TURNSTILE_FAILED" });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
