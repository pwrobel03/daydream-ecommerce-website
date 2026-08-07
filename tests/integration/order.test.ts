import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Sesja jest jedyną rzeczą, którą podmieniamy — baza jest prawdziwa.
const { session, db } = vi.hoisted(() => ({
  session: { user: { id: "", role: "USER" as const } },
  db: new (require("@prisma/client").PrismaClient)() as PrismaClient,
}));

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

const { initializeOrder } = await import("@/actions/order/order");

let userId: string;
let productId: string;

beforeAll(async () => {
  const user = await db.user.create({
    data: { email: "buyer@example.com", name: "Buyer" },
  });
  userId = user.id;
  session.user.id = userId;
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();

  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  productId = product.id;
});

describe("initializeOrder", () => {
  it("prices the order from the database, ignoring anything the client sends", async () => {
    // Regresja na manipulację ceną: akcja przyjmuje wyłącznie id i ilość,
    // więc podrobiony koszyk nie ma jak wpłynąć na kwotę.
    const result = await initializeOrder([{ productId, quantity: 2 }]);
    expect(result.error).toBeUndefined();

    const order = await db.order.findUniqueOrThrow({
      where: { id: result.orderId! },
      include: { items: true },
    });

    expect(order.totalAmount.toNumber()).toBe(50);
    expect(order.items[0].price.toNumber()).toBe(25);
  });

  it("prefers promoPrice when the product has one", async () => {
    await db.product.update({ where: { id: productId }, data: { promoPrice: 10 } });

    const result = await initializeOrder([{ productId, quantity: 3 }]);
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    expect(order.totalAmount.toNumber()).toBe(30);
  });

  it("decrements stock by the ordered quantity", async () => {
    await initializeOrder([{ productId, quantity: 4 }]);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(6);
  });

  it("refuses to oversell and leaves stock untouched", async () => {
    const result = await initializeOrder([{ productId, quantity: 11 }]);

    expect(result.error).toBeDefined();
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
    expect(await db.order.count()).toBe(0);
  });

  it("merges a product sent twice instead of running two stock checks", async () => {
    // Bez scalania obie pozycje przechodziłyby kontrolę niezależnie
    // i razem zdjęły więcej, niż wynosi stan.
    const result = await initializeOrder([
      { productId, quantity: 6 },
      { productId, quantity: 6 },
    ]);

    expect(result.error).toBeDefined();
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("does not let concurrent checkouts drive stock below zero", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 5 } });

    const results = await Promise.all([
      initializeOrder([{ productId, quantity: 4 }]),
      initializeOrder([{ productId, quantity: 4 }]),
    ]);

    const succeeded = results.filter((r) => !r.error);
    expect(succeeded).toHaveLength(1);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(1);
  });

  it("sets a reservation deadline so the sweep can reclaim abandoned orders", async () => {
    const result = await initializeOrder([{ productId, quantity: 1 }]);
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    expect(order.reservedUntil).not.toBeNull();
    expect(order.reservedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a malformed cart", async () => {
    const result = await initializeOrder([{ productId, quantity: 0 }] as never);
    expect(result.error).toBeDefined();
    expect(await db.order.count()).toBe(0);
  });

  it("rejects an unknown product without partially reserving anything", async () => {
    const result = await initializeOrder([
      { productId, quantity: 1 },
      { productId: "does-not-exist", quantity: 1 },
    ]);

    expect(result.error).toBeDefined();
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });
});
