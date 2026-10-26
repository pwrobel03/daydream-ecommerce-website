import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { expectFail, expectOk } from "../helpers/action-result";
import { resetDatabase } from "./reset";

const { db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return { db: createPrismaClient() };
});

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: async () => true,
  sendPasswordResetEmail: async () => true,
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: async () => true }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: async () => "127.0.0.1",
  rateLimit: async () => ({ allowed: true }),
}));

import { newPassword } from "@/actions/auth/reset-password";
import { generatePasswordResetToken } from "@/lib/token";

const EMAIL = "user@example.com";
const OLD_PASSWORD = "old-password";
const NEW_PASSWORD = "new-password-1";
const values = { password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

async function passwordHash() {
  return (await db.user.findUniqueOrThrow({ where: { email: EMAIL } })).password!;
}

beforeEach(async () => {
  await resetDatabase(db);
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
  await db.user.create({ data: { email: EMAIL, name: "User", password: await bcrypt.hash(OLD_PASSWORD, 4) } });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("newPassword", () => {
  it("sets a password bcrypt accepts and deletes the token", async () => {
    const { token } = await generatePasswordResetToken(EMAIL);

    expectOk(await newPassword(values, token));

    expect(await bcrypt.compare(NEW_PASSWORD, await passwordHash())).toBe(true);
    expect(await db.passwordResetToken.count({ where: { token } })).toBe(0);
  });

  it("refuses the same token a second time and keeps the password", async () => {
    const { token } = await generatePasswordResetToken(EMAIL);
    expectOk(await newPassword(values, token));
    const hash = await passwordHash();

    const again = { password: "another-password", confirmPassword: "another-password" };
    expectFail(await newPassword(again, token), "NOT_FOUND");

    expect(await passwordHash()).toBe(hash);
  });

  it("refuses an expired token and keeps the password", async () => {
    const { token } = await generatePasswordResetToken(EMAIL);
    await db.passwordResetToken.update({ where: { token }, data: { expires: new Date(Date.now() - 1000) } });
    const hash = await passwordHash();

    expectFail(await newPassword(values, token), "NOT_FOUND");

    expect(await passwordHash()).toBe(hash);
  });

  it("refuses an unknown token and an empty token", async () => {
    const hash = await passwordHash();

    expectFail(await newPassword(values, "no-such-token"), "NOT_FOUND");
    expectFail(await newPassword(values, ""), "INVALID_INPUT");

    expect(await passwordHash()).toBe(hash);
  });

  it.each([
    ["a password shorter than 8 characters", { password: "short", confirmPassword: "short" }],
    ["a confirmation that does not match", { password: NEW_PASSWORD, confirmPassword: "different-password" }],
  ])("rejects %s and keeps the token", async (_name, input) => {
    const { token } = await generatePasswordResetToken(EMAIL);
    const hash = await passwordHash();

    expectFail(await newPassword(input, token), "INVALID_INPUT");

    expect(await db.passwordResetToken.count({ where: { token } })).toBe(1);
    expect(await passwordHash()).toBe(hash);
  });

  it("resets the account stored lower-case from a token issued for a mixed-case address", async () => {
    const { token } = await generatePasswordResetToken("User@Example.com");

    expectOk(await newPassword(values, token));

    expect(await bcrypt.compare(NEW_PASSWORD, await passwordHash())).toBe(true);
  });
});
