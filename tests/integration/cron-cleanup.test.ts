import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return { db: createPrismaClient() };
});

vi.mock("@/lib/db", () => ({ db }));

const { POST } = await import("@/app/api/cron/release-reservations/route");

const HOUR = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.verificationToken.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.user.deleteMany({ where: { email: { endsWith: "@cleanup.test" } } });
});

function call() {
  return POST(
    new Request("http://localhost/api/cron/release-reservations", {
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret-value" },
    }),
  );
}

async function user(name: string, data: Record<string, unknown> = {}) {
  const email = `${name}@cleanup.test`;
  return db.user.create({ data: { email, createdAt: ago(25), ...data } });
}

const exists = async (id: string) => (await db.user.findUnique({ where: { id } })) !== null;

describe("cron: unverified registrations", () => {
  it("deletes a 25 h old unverified user with its tokens", async () => {
    const u = await user("old");
    await db.verificationToken.create({
      data: { email: u.email!, token: "v-old", expires: ago(-1) },
    });
    await db.passwordResetToken.create({
      data: { email: u.email!, token: "p-old", expires: ago(-1) },
    });

    const body = await (await call()).json();

    expect(body.deletedUnverified).toBe(1);
    expect(await exists(u.id)).toBe(false);
    expect(await db.verificationToken.count()).toBe(0);
    expect(await db.passwordResetToken.count()).toBe(0);
  });

  it("keeps a 23 h old unverified user", async () => {
    const u = await user("fresh", { createdAt: ago(23) });
    const body = await (await call()).json();
    expect(body.deletedUnverified).toBe(0);
    expect(await exists(u.id)).toBe(true);
  });

  it("keeps an unverified user that has an order", async () => {
    const u = await user("ordered");
    await db.order.create({ data: { userId: u.id, totalAmount: 10 } });
    const body = await (await call()).json();
    expect(body.deletedUnverified).toBe(0);
    expect(await exists(u.id)).toBe(true);
  });

  it("keeps a verified user", async () => {
    const u = await user("verified", { emailVerified: ago(30) });
    await call();
    expect(await exists(u.id)).toBe(true);
  });

  // The DEMO_ADMIN role (ADR 0009) is not in the schema yet; the `role: USER` filter covers it.
  it("keeps an unverified ADMIN", async () => {
    const u = await user("admin", { role: "ADMIN" });
    await call();
    expect(await exists(u.id)).toBe(true);
  });
});
