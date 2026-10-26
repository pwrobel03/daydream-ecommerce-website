import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { expectFail, expectOk } from "../helpers/action-result";
import { resetDatabase } from "./reset";

// Real database, only the session is replaced.
const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "admin-1", role: "ADMIN" as string } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { updateOrderStatus } = await import("@/actions/admin/orders");

afterAll(async () => {
  await db.$disconnect();
});

let productId: string;

beforeAll(async () => {
  await db.user.create({ data: { id: "admin-1", email: "admin-status@example.com", role: "ADMIN" } });
});

beforeEach(async () => {
  await resetDatabase(db);
  // Stock 7 = 10 minus the 3 units reserved by the order below.
  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 7 },
  });
  productId = product.id;
});

async function makeOrder(status: OrderStatus) {
  return db.order.create({
    data: {
      userId: "admin-1",
      totalAmount: 75,
      status,
      isPaid: status !== "PENDING" && status !== "CANCELLED",
      items: { create: { productId, quantity: 3, price: 25 } },
    },
  });
}

const stock = async () => (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock;

describe("updateOrderStatus", () => {
  it.each([
    ["PENDING", "CANCELLED"],
    ["PAID", "SHIPPED"],
    ["SHIPPED", "DELIVERED"],
  ] as const)("allows %s -> %s", async (from, to) => {
    const order = await makeOrder(from);
    expectOk(await updateOrderStatus(order.id, to));
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(to);
  });

  it("returns the reserved stock when a pending order is cancelled, once", async () => {
    const order = await makeOrder("PENDING");
    expectOk(await updateOrderStatus(order.id, "CANCELLED"));
    expect(await stock()).toBe(10);
    expectFail(await updateOrderStatus(order.id, "CANCELLED"), "CONFLICT");
    expect(await stock()).toBe(10);
  });

  it.each([
    ["PENDING", "PAID"],
    ["PAID", "PENDING"],
    ["DELIVERED", "SHIPPED"],
  ] as const)("refuses %s -> %s and changes nothing", async (from, to) => {
    const order = await makeOrder(from);
    expectFail(await updateOrderStatus(order.id, to), "CONFLICT");
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(from);
    expect(await stock()).toBe(7);
  });
});
