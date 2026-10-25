import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "./reset";

// Real database, only the session is replaced: the demo admin must never
// receive the buyer's personal data from the back-office order list (ADR 0009).
const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "masking-viewer", role: "DEMO_ADMIN" as string } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

const { getAdminOrders } = await import("@/lib/db-orders");

const buyer = {
  id: "masking-buyer",
  name: "Zofia Wiśniewska",
  email: "zofia.masking@example.com",
};
const address = {
  fullName: "Zofia Wiśniewska",
  street: "Lipowa 17/4",
  city: "Kraków",
  zipCode: "30-001",
  phone: "+48 600 700 800",
};
let addressId: string;
let orderId: string;

beforeAll(async () => {
  await db.user.create({ data: { id: "masking-viewer", email: "masking-viewer@example.com" } });
  await db.user.create({ data: buyer });
  addressId = (await db.address.create({ data: address })).id;
});

afterAll(async () => {
  await resetDatabase(db);
  await db.address.delete({ where: { id: addressId } });
  await db.user.deleteMany({ where: { id: { in: [buyer.id, "masking-viewer"] } } });
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(db);
  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  orderId = (
    await db.order.create({
      data: {
        userId: buyer.id,
        addressId,
        totalAmount: 25,
        items: { create: { productId: product.id, quantity: 1, price: 25 } },
      },
    })
  ).id;
});

describe("getAdminOrders as DEMO_ADMIN", () => {
  beforeEach(() => {
    session.user.role = "DEMO_ADMIN";
  });

  it("returns no personal data of the buyer, only a stable pseudonym", async () => {
    const result = await getAdminOrders(1, 15);
    const json = JSON.stringify(result);

    for (const value of [buyer.email, buyer.name, buyer.id, address.street, address.phone]) {
      expect(json).not.toContain(value);
    }
    expect(result.masked).toBe(true);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]).not.toHaveProperty("user");
    expect(result.orders[0]).not.toHaveProperty("address");
    expect(result.orders[0]).not.toHaveProperty("userId");
    expect(result.orders[0]).toHaveProperty(
      "customerTag",
      createHash("sha256").update(buyer.id).digest("hex").slice(0, 4)
    );
  });

  it("does not find the order by the buyer's e-mail or street", async () => {
    expect((await getAdminOrders(1, 15, buyer.email)).totalCount).toBe(0);
    expect((await getAdminOrders(1, 15, address.street)).totalCount).toBe(0);
  });

  it("finds the order by its ID", async () => {
    expect((await getAdminOrders(1, 15, orderId)).totalCount).toBe(1);
  });
});

describe("getAdminOrders as ADMIN", () => {
  beforeEach(() => {
    session.user.role = "ADMIN";
  });

  it("returns the buyer and the address", async () => {
    const result = await getAdminOrders(1, 15);
    expect(result.masked).toBe(false);
    expect(result.orders[0]).toMatchObject({
      user: { name: buyer.name, email: buyer.email },
      address,
    });
  });

  it("finds the order by the buyer's e-mail or street", async () => {
    expect((await getAdminOrders(1, 15, buyer.email)).orders[0]?.id).toBe(orderId);
    expect((await getAdminOrders(1, 15, address.street)).orders[0]?.id).toBe(orderId);
  });
});
