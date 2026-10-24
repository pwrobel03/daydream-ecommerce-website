import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectFail, expectOk } from "../helpers/action-result";
import { resetDatabase } from "./reset";

// Sesja jest jedyną rzeczą, którą podmieniamy — baza jest prawdziwa.
// Fabryka musi być asynchroniczna: vi.hoisted wykonuje się przed importami,
// więc klienta Prismy trzeba wciągnąć dynamicznie w jej środku.
const { session, db } = await vi.hoisted(async () => {
  // Ten sam klient co produkcja — z rozszerzeniem zamieniającym Decimal na
  // number. Własna instancja PrismaClient testowałaby inny kod niż działający.
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "", role: "USER" as const } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

// Stripe jest zamockowane — test nie ma sieci, a sprawdza wyłącznie parametry sesji.
const { couponCreate, sessionCreate } = vi.hoisted(() => ({
  couponCreate: vi.fn(async (_params: { amount_off: number }) => ({ id: "coupon_1" })),
  sessionCreate: vi.fn(async (_params: {
    line_items: { price_data: { unit_amount: number }; quantity: number }[];
  }) => ({ id: "cs_test_retry", url: "https://stripe.test/pay", livemode: false })),
}));
vi.mock("stripe", () => ({
  default: class {
    coupons = { create: couponCreate };
    checkout = { sessions: { create: sessionCreate } };
  },
}));

const { initializeOrder, recreateStripeSession } = await import("@/actions/order/order");

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
  await resetDatabase(db);

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
    const { orderId } = expectOk(result);

    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    expect(order.totalAmount).toBe(50);
    expect(order.items[0].price).toBe(25);
  });

  it("prefers promoPrice when the product has one", async () => {
    await db.product.update({ where: { id: productId }, data: { promoPrice: 10 } });

    const result = await initializeOrder([{ productId, quantity: 3 }]);
    const order = await db.order.findUniqueOrThrow({ where: { id: expectOk(result).orderId } });

    expect(order.totalAmount).toBe(30);
  });

  it("decrements stock by the ordered quantity", async () => {
    await initializeOrder([{ productId, quantity: 4 }]);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(6);
  });

  it("refuses to oversell and leaves stock untouched", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 5 } });
    const result = await initializeOrder([{ productId, quantity: 6 }]);

    expectFail(result, "OUT_OF_STOCK");
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(5);
    expect(await db.order.count()).toBe(0);
  });

  it("rejects more than 10 units of one product", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 50 } });
    const result = await initializeOrder([{ productId, quantity: 11 }]);

    expectFail(result, "INVALID_INPUT");
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(50);
    expect(await db.order.count()).toBe(0);
  });

  it("merges a product sent twice instead of running two stock checks", async () => {
    // Bez scalania obie pozycje przechodziłyby kontrolę niezależnie
    // i razem zdjęły więcej, niż wynosi stan.
    const result = await initializeOrder([
      { productId, quantity: 6 },
      { productId, quantity: 6 },
    ]);

    expectFail(result, "INVALID_INPUT");
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("does not let concurrent checkouts drive stock below zero", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 5 } });

    const results = await Promise.all([
      initializeOrder([{ productId, quantity: 4 }]),
      initializeOrder([{ productId, quantity: 4 }]),
    ]);

    const succeeded = results.filter((r) => r.ok);
    expect(succeeded).toHaveLength(1);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(1);
  });

  it("sets a reservation deadline so the sweep can reclaim abandoned orders", async () => {
    const result = await initializeOrder([{ productId, quantity: 1 }]);
    const order = await db.order.findUniqueOrThrow({ where: { id: expectOk(result).orderId } });

    expect(order.reservedUntil).not.toBeNull();
    expect(order.reservedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a malformed cart", async () => {
    const result = await initializeOrder([{ productId, quantity: 0 }] as never);
    expectFail(result, "INVALID_INPUT");
    expect(await db.order.count()).toBe(0);
  });

  it("rejects an unknown product without partially reserving anything", async () => {
    const result = await initializeOrder([
      { productId, quantity: 1 },
      { productId: "does-not-exist", quantity: 1 },
    ]);

    expectFail(result, "OUT_OF_STOCK");
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });
});

describe("recreateStripeSession", () => {
  it("charges the same total as the first attempt, discount included", async () => {
    const now = Date.now();
    await db.sale.create({
      data: {
        name: "Spring",
        couponCode: "SPRING20",
        discountValue: 20,
        isActive: true,
        validFrom: new Date(now - 3600_000),
        validTo: new Date(now + 3600_000),
      },
    });
    const { orderId } = expectOk(await initializeOrder([{ productId, quantity: 2 }], "SPRING20"));
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });

    expectOk(await recreateStripeSession(orderId));

    const params = sessionCreate.mock.calls.at(-1)![0];
    const lines = params.line_items.reduce((sum, l) => sum + l.price_data.unit_amount * l.quantity, 0);
    const off = couponCreate.mock.calls.at(-1)![0].amount_off;
    expect(lines - off).toBe(Math.round(order.totalAmount * 100));
    expect(order.discountAmount).toBeGreaterThan(0);
  });
});
