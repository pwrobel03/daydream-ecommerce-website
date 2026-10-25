import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { expectFail, expectOk } from "../helpers/action-result";
import { resetDatabase } from "./reset";

const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "doomed", role: "USER" as string } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { deleteAccount } = await import("@/actions/user/delete-account");

const EMAIL = "doomed@example.com";

afterAll(async () => {
  await db.$disconnect();
});

let productId: string;

beforeEach(async () => {
  session.user = { id: "doomed", role: "USER" };
  await resetDatabase(db);
  await db.account.deleteMany();
  await db.user.deleteMany({ where: { id: { in: ["doomed", "demo-admin-x", "admin-x"] } } });
  await db.address.deleteMany();
  await db.verificationToken.deleteMany();
  await db.passwordResetToken.deleteMany();

  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  productId = product.id;

  const profileAddress = { fullName: "A", street: "S", city: "C", zipCode: "00-001", phone: "1" };
  await db.user.create({
    data: {
      id: "doomed",
      email: EMAIL,
      password: await bcrypt.hash("correct-horse", 4),
      address: { create: profileAddress },
    },
  });
  // The pending order holds 2 units; the stock was already decremented when it was reserved.
  await db.product.update({ where: { id: productId }, data: { stock: 8 } });
  const orderAddress = await db.address.create({ data: profileAddress });
  await db.order.create({
    data: {
      userId: "doomed",
      totalAmount: 50,
      status: "PENDING",
      addressId: orderAddress.id,
      items: { create: { productId, quantity: 2, price: 25 } },
    },
  });
  await db.order.create({
    data: {
      userId: "doomed",
      totalAmount: 25,
      status: "PAID",
      isPaid: true,
      items: { create: { productId, quantity: 1, price: 25 } },
    },
  });
  await db.review.create({ data: { userId: "doomed", productId, content: "ok" } });
  await db.account.create({
    data: { userId: "doomed", type: "oauth", provider: "github", providerAccountId: "gh-1" },
  });
  await db.verificationToken.create({
    data: { email: EMAIL, token: "v", expires: new Date(Date.now() + 1e6) },
  });
  await db.passwordResetToken.create({
    data: { email: EMAIL, token: "p", expires: new Date(Date.now() + 1e6) },
  });
});

describe("deleteAccount", () => {
  it("deletes the user and their data and returns the pending stock", async () => {
    expectOk(await deleteAccount({ password: "correct-horse" }));

    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
    expect(await db.user.count({ where: { id: "doomed" } })).toBe(0);
    expect(await db.order.count({ where: { userId: "doomed" } })).toBe(0);
    expect(await db.orderItem.count()).toBe(0);
    expect(await db.address.count()).toBe(0);
    expect(await db.review.count({ where: { userId: "doomed" } })).toBe(0);
    expect(await db.account.count({ where: { userId: "doomed" } })).toBe(0);
    expect(await db.verificationToken.count({ where: { email: EMAIL } })).toBe(0);
    expect(await db.passwordResetToken.count({ where: { email: EMAIL } })).toBe(0);
  });

  it("deletes an account without a password when the e-mail matches", async () => {
    await db.user.update({ where: { id: "doomed" }, data: { password: null } });
    expectFail(await deleteAccount({ email: "other@example.com" }), "INVALID_INPUT");
    expect(await db.user.count({ where: { id: "doomed" } })).toBe(1);
    expectOk(await deleteAccount({ email: EMAIL.toUpperCase() }));
    expect(await db.user.count({ where: { id: "doomed" } })).toBe(0);
  });

  it("deletes nothing on a wrong password", async () => {
    expectFail(await deleteAccount({ password: "wrong-password" }), "INVALID_INPUT");
    expectFail(await deleteAccount({}), "INVALID_INPUT");
    expect(await db.user.count({ where: { id: "doomed" } })).toBe(1);
    expect(await db.order.count({ where: { userId: "doomed" } })).toBe(2);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);
  });

  it.each(["ADMIN", "DEMO_ADMIN"] as const)("refuses %s", async (role) => {
    await db.user.update({ where: { id: "doomed" }, data: { role } });
    session.user.role = role;
    expectFail(await deleteAccount({ password: "correct-horse" }), "FORBIDDEN");
    expect(await db.user.count({ where: { id: "doomed" } })).toBe(1);
    expect(await db.order.count({ where: { userId: "doomed" } })).toBe(2);
  });
});
