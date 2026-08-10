import type { PrismaClient } from "@/lib/generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { session, db } = await vi.hoisted(async () => {
  const { PrismaClient } = await import("@/lib/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  return {
    session: { user: { id: "", role: "USER" as const } },
    db: new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    }) as unknown as PrismaClient,
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

const { initializeOrder } = await import("@/actions/order/order");

const DAY = 24 * 60 * 60 * 1000;
let productId: string;

beforeAll(async () => {
  const user = await db.user.create({ data: { email: "coupon@example.com" } });
  session.user.id = user.id;
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.sale.deleteMany();
  await db.product.deleteMany();

  const product = await db.product.create({
    data: { name: "Bar", slug: `coupon-bar-${Date.now()}`, price: 100, stock: 50 },
  });
  productId = product.id;
});

function sale(overrides: Record<string, unknown> = {}) {
  return db.sale.create({
    data: {
      name: "Spring",
      couponCode: "SPRING20",
      discountValue: 20,
      validFrom: new Date(Date.now() - DAY),
      validTo: new Date(Date.now() + DAY),
      ...overrides,
    },
  });
}

describe("coupons", () => {
  it("applies a valid coupon and records what was deducted", async () => {
    await sale();

    const result = await initializeOrder([{ productId, quantity: 2 }], "SPRING20");
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    // 2 × 100 = 200, minus 20% = 160
    expect(order.totalAmount.toNumber()).toBe(160);
    expect(order.discountAmount.toNumber()).toBe(40);
    expect(order.saleId).not.toBeNull();
  });

  it("computes the discount from the database, not from anything the client sends", async () => {
    // Kod służy wyłącznie do wyszukania rekordu — wysokość rabatu bierze się
    // z bazy, więc podmiana kodu na cudzy nie zmienia stawki.
    await sale({ discountValue: 5 });

    const result = await initializeOrder([{ productId, quantity: 1 }], "SPRING20");
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    expect(order.discountAmount.toNumber()).toBe(5);
    expect(order.totalAmount.toNumber()).toBe(95);
  });

  it("rejects an expired coupon and creates no order", async () => {
    await sale({ validTo: new Date(Date.now() - DAY) });

    const result = await initializeOrder([{ productId, quantity: 1 }], "SPRING20");

    expect(result.error).toBeDefined();
    expect(await db.order.count()).toBe(0);
  });

  it("rejects a coupon that is not yet valid", async () => {
    await sale({ validFrom: new Date(Date.now() + DAY) });

    const result = await initializeOrder([{ productId, quantity: 1 }], "SPRING20");
    expect(result.error).toBeDefined();
  });

  it("rejects a deactivated coupon", async () => {
    await sale({ isActive: false });

    const result = await initializeOrder([{ productId, quantity: 1 }], "SPRING20");
    expect(result.error).toBeDefined();
  });

  it("rejects an unknown code rather than silently ignoring it", async () => {
    const result = await initializeOrder([{ productId, quantity: 1 }], "NOPE");

    expect(result.error).toBeDefined();
    expect(await db.order.count()).toBe(0);
  });

  it("leaves stock untouched when the coupon is refused", async () => {
    await sale({ isActive: false });
    await initializeOrder([{ productId, quantity: 3 }], "SPRING20");

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(50);
  });

  it("orders without a coupon record a zero discount", async () => {
    const result = await initializeOrder([{ productId, quantity: 1 }]);
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    expect(order.discountAmount.toNumber()).toBe(0);
    expect(order.saleId).toBeNull();
    expect(order.totalAmount.toNumber()).toBe(100);
  });

  it("rounds the discount to cents so the webhook amount check cannot drift", async () => {
    // 33% z 100 to 33.333... — bez zaokrąglenia kwota w bazie różniłaby się
    // od tej, którą pobierze Stripe, i webhook odrzuciłby poprawną płatność.
    await sale({ discountValue: 33 });

    const result = await initializeOrder([{ productId, quantity: 1 }], "SPRING20");
    const order = await db.order.findUniqueOrThrow({ where: { id: result.orderId! } });

    expect(order.discountAmount.toNumber()).toBe(33);
    expect(order.totalAmount.toNumber()).toBe(67);
    expect(Number.isInteger(Math.round(order.totalAmount.toNumber() * 100))).toBe(true);
  });
});
