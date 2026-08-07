import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: new (require("@prisma/client").PrismaClient)() as PrismaClient,
}));

vi.mock("@/lib/db", () => ({ db }));

const { POST } = await import("@/app/api/webhook/stripe/route");

const WEBHOOK_SECRET = "whsec_dummy";
const stripe = new Stripe("sk_test_dummy");

// Buduje żądanie z prawdziwym podpisem Stripe, żeby test przechodził
// przez tę samą weryfikację co produkcja.
function signedRequest(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

  return new Request("http://localhost/api/webhook/stripe", {
    method: "POST",
    body: payload,
    headers: { "Stripe-Signature": signature },
  });
}

function completedEvent(id: string, orderId: string, amountTotal: number, sessionId = "cs_test_1") {
  return {
    id,
    type: "checkout.session.completed",
    data: { object: { id: sessionId, amount_total: amountTotal, metadata: { orderId } } },
  };
}

function expiredEvent(id: string, orderId: string) {
  return {
    id,
    type: "checkout.session.expired",
    data: { object: { id: "cs_test_1", metadata: { orderId } } },
  };
}

let userId: string;
let productId: string;
let orderId: string;

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.processedWebhookEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();

  const user = await db.user.create({ data: { email: "wh@example.com" } });
  userId = user.id;

  const product = await db.product.create({
    data: { name: "Bar", slug: `wh-bar-${Date.now()}`, price: 25, stock: 8 },
  });
  productId = product.id;

  const order = await db.order.create({
    data: {
      userId,
      totalAmount: 50,
      stripeSessionId: "cs_test_1",
      items: { create: [{ productId, quantity: 2, price: 25 }] },
    },
  });
  orderId = order.id;
});

describe("stripe webhook", () => {
  it("rejects a request whose signature does not verify", async () => {
    const request = new Request("http://localhost/api/webhook/stripe", {
      method: "POST",
      body: JSON.stringify(completedEvent("evt_1", orderId, 5000)),
      headers: { "Stripe-Signature": "t=1,v1=deadbeef" },
    });

    expect((await POST(request)).status).toBe(400);

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.isPaid).toBe(false);
  });

  it("marks the order paid on a valid completed event", async () => {
    await POST(signedRequest(completedEvent("evt_2", orderId, 5000)));

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.isPaid).toBe(true);
    expect(order.status).toBe("PAID");
  });

  it("refuses to mark paid when the amount does not match the order total", async () => {
    await POST(signedRequest(completedEvent("evt_3", orderId, 1)));

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.isPaid).toBe(false);
  });

  it("refuses to mark paid when the session is not the one we opened", async () => {
    await POST(signedRequest(completedEvent("evt_4", orderId, 5000, "cs_someone_else")));

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.isPaid).toBe(false);
  });

  it("restocks and cancels the order when the session expires", async () => {
    await POST(signedRequest(expiredEvent("evt_5", orderId)));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });

    expect(product.stock).toBe(10);
    expect(order.status).toBe("CANCELLED");
  });

  it("restocks only once when Stripe redelivers the same expiry event", async () => {
    // To jest regresja, dla której powstała tabela ProcessedWebhookEvent.
    const event = expiredEvent("evt_6", orderId);

    await POST(signedRequest(event));
    await POST(signedRequest(event));
    await POST(signedRequest(event));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("restocks only once when two distinct expiry events target the same order", async () => {
    // Wyścig domknięty warunkowym updateMany, nie samą idempotencją po id eventu.
    await Promise.all([
      POST(signedRequest(expiredEvent("evt_7a", orderId))),
      POST(signedRequest(expiredEvent("evt_7b", orderId))),
    ]);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("records the event id so a replay is recognised", async () => {
    await POST(signedRequest(completedEvent("evt_8", orderId, 5000)));

    const recorded = await db.processedWebhookEvent.findUnique({ where: { id: "evt_8" } });
    expect(recorded).not.toBeNull();
  });

  it("acknowledges unrelated event types without recording them", async () => {
    const response = await POST(
      signedRequest({ id: "evt_9", type: "customer.created", data: { object: {} } })
    );

    expect(response.status).toBe(200);
    expect(await db.processedWebhookEvent.count()).toBe(0);
  });
});
