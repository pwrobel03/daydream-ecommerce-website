import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "pg";
import { expectOk } from "../helpers/action-result";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
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
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
const currentUser = vi.hoisted(() => ({ value: null as { id: string; email: string; isOAuth: boolean } | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => currentUser.value }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: async () => "127.0.0.1",
  rateLimit: async () => ({ allowed: true }),
}));

import { register } from "@/actions/auth/register";
import { settings } from "@/actions/user/settings";
import { resetPassword } from "@/actions/auth/reset-password";
import { newVerification } from "@/actions/auth/verify-email";
import { getUserByEmail } from "@/data/user";
import { createAdmin } from "@/scripts/create-admin";

const plainDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

beforeEach(async () => {
  await resetDatabase(db);
  await db.passwordResetToken.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
  await plainDb.$disconnect();
});

describe("e-mail case", () => {
  it("registers Mixed@Example.com and finds, resets and verifies it as mixed@example.com", async () => {
    expectOk(await register({ email: "Mixed@Example.com", password: "password-1", name: "Mixed" }));

    const user = await getUserByEmail("mixed@example.com");
    expect(user?.email).toBe("mixed@example.com");
    expect((await getUserByEmail("MIXED@example.com"))?.id).toBe(user?.id);

    expectOk(await resetPassword({ email: "mixed@example.com" }));
    expect(await db.passwordResetToken.count({ where: { email: "mixed@example.com" } })).toBe(1);

    const verification = await db.verificationToken.findFirstOrThrow({ where: { email: "mixed@example.com" } });
    expectOk(await newVerification(verification.token));
    expect((await db.user.findUniqueOrThrow({ where: { id: user!.id } })).emailVerified).toBeInstanceOf(Date);
  });

  it("registering a second casing is refused as a duplicate", async () => {
    expectOk(await register({ email: "Mixed@Example.com", password: "password-1", name: "Mixed" }));
    const second = await register({ email: "mixed@example.com", password: "password-1", name: "Mixed" });
    expect(second.ok).toBe(false);
    expect(await db.user.count()).toBe(1);
  });

  it("settings stores a changed e-mail lower-cased", async () => {
    expectOk(await register({ email: "old@example.com", password: "password-1", name: "Old" }));
    const user = await db.user.findUniqueOrThrow({ where: { email: "old@example.com" } });
    currentUser.value = { id: user.id, email: user.email!, isOAuth: false };

    expectOk(await settings({ email: "New@Example.com" }));

    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe("new@example.com");
  });

  it("createAdmin with two casings updates one row", async () => {
    await createAdmin(plainDb, { email: "Owner@Example.com", password: "first-password-1" });
    await createAdmin(plainDb, { email: "owner@EXAMPLE.com", password: "second-password-2" });

    const users = await db.user.findMany();
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ email: "owner@example.com", role: "ADMIN" });
  });
});

describe("lowercase_emails migration", () => {
  const migration = "20260811100000_lowercase_emails";

  async function runMigration() {
    const { readFileSync } = await import("fs");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    } finally {
      await client.end();
    }
  }

  it("lower-cases existing e-mails", async () => {
    await db.user.create({ data: { email: "Old@Example.com" } });
    await db.verificationToken.create({ data: { email: "Old@Example.com", token: "v", expires: new Date() } });
    await db.passwordResetToken.create({ data: { email: "Old@Example.com", token: "p", expires: new Date() } });

    await runMigration();

    expect((await db.user.findFirstOrThrow()).email).toBe("old@example.com");
    expect((await db.verificationToken.findFirstOrThrow()).email).toBe("old@example.com");
    expect((await db.passwordResetToken.findFirstOrThrow()).email).toBe("old@example.com");
  });

  it("fails on a case-only duplicate, naming it, and changes nothing", async () => {
    await db.user.createMany({ data: [{ email: "Dup@Example.com" }, { email: "dup@example.com" }, { email: "Other@Example.com" }] });

    await expect(runMigration()).rejects.toThrow(/Dup@Example\.com, dup@example\.com/);

    const emails = (await db.user.findMany({ orderBy: { email: "asc" } })).map((u) => u.email);
    expect(emails).toEqual(["Dup@Example.com", "Other@Example.com", "dup@example.com"]);
  });
});
