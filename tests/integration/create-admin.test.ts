import { createAdmin } from "@/scripts/create-admin";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/lib/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

afterAll(async () => {
  await db.$disconnect();
});

describe("createAdmin", () => {
  it("leaves one ADMIN that matches the second password after two runs", async () => {
    const email = "owner@example.com";
    await db.user.create({ data: { email, name: "Owner", role: "USER" } });

    await createAdmin(db, { email, password: "first-password-1" });
    await createAdmin(db, { email, password: "second-password-2" });

    const users = await db.user.findMany({ where: { email } });
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ role: "ADMIN", name: "Owner" });
    expect(users[0].emailVerified).toBeInstanceOf(Date);
    expect(await bcrypt.compare("second-password-2", users[0].password!)).toBe(true);
    expect(await bcrypt.compare("first-password-1", users[0].password!)).toBe(false);
  });
});
