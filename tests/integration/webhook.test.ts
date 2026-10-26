import Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tx } from "@/lib/orders";
import { resetDatabase } from "./reset";

// Fabryka asynchroniczna — patrz komentarz w order.test.ts.
const { db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return { db: createPrismaClient() };
});

vi.mock("@/lib/db", () => ({ db }));

// Domyślnie przepuszcza do prawdziwej implementacji; testy podmieniają ją na rzucającą.
vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, releaseOrderReservationIn: vi.fn(actual.releaseOrderReservationIn) };
});

const { releaseOrderReservationIn } = await import("@/lib/orders");

const { POST } = await import("@/app/api/webhook/stripe/route");
const { POST: runCron } = await import("@/app/api/cron/release-reservations/route");

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

function failedEvent(id: string, orderId: string) {
  return {
    id,
    type: "payment_intent.payment_failed",
    data: { object: { id: "pi_test_1", metadata: { orderId } } },
  };
}

let userId: string;
let productId: string;
let orderId: string;

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(db);
  // Tylko własne konto: `user.deleteMany()` bez filtra kasowało konta
  // pozostałych suit i działało wyłącznie dlatego, że ten plik szedł ostatni.
  await db.user.deleteMany({ where: { email: "wh@example.com" } });

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
  it("acknowledges a live-mode event and leaves the order PENDING", async () => {
    const event = { ...completedEvent("evt_live_1", orderId, 5000), livemode: true };

    const response = await POST(signedRequest(event));

    expect(response.status).toBe(200);
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("PENDING");
  });

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

  it("returns the stock of a paid order", async () => {
    await POST(signedRequest(completedEvent("evt_2b", orderId, 5000)));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("restocks only once when the same completed event is redelivered", async () => {
    const event = completedEvent("evt_2c", orderId, 5000);

    await POST(signedRequest(event));
    await POST(signedRequest(event));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
  });

  it("does not restock again when completed arrives after expired", async () => {
    await POST(signedRequest(expiredEvent("evt_2d", orderId)));
    await POST(signedRequest(completedEvent("evt_2e", orderId, 5000)));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(10);
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

  it("ends PAID with consistent stock when a declined card is followed by a successful retry", async () => {
    // Karta 4000 0000 0000 0002, potem 4242… w tej samej sesji Checkout.
    await POST(signedRequest(failedEvent("evt_10a", orderId)));
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("CANCELLED");

    await POST(signedRequest(completedEvent("evt_10b", orderId, 5000)));

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(order.status).toBe("PAID");
    expect(order.isPaid).toBe(true);
    // Anulowanie oddało towar, a płatność testowa nie oddaje go drugi raz.
    expect(product.stock).toBe(10);
  });

  it("acknowledges a completed event for an order that no longer exists and changes nothing", async () => {
    await db.order.delete({ where: { id: orderId } });

    const response = await POST(signedRequest(completedEvent("evt_11", orderId, 5000)));

    expect(response.status).toBe(200);
    expect(await db.order.count()).toBe(0);
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(8);
  });

  it("acknowledges an expired event for an order that no longer exists", async () => {
    await db.order.delete({ where: { id: orderId } });

    const response = await POST(signedRequest(expiredEvent("evt_12", orderId)));

    expect(response.status).toBe(200);
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(8);
  });

  it("returns stock once when the expiry event and the reservation cron hit the same order", async () => {
    await db.order.update({ where: { id: orderId }, data: { reservedUntil: new Date(Date.now() - 1000) } });
    const cron = new Request("http://localhost/api/cron/release-reservations", {
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret-value" },
    });

    await Promise.all([POST(signedRequest(expiredEvent("evt_13", orderId))), runCron(cron)]);

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("CANCELLED");
    expect(product.stock).toBe(10);
  });

  it("leaves stock untouched when the amount or session check fails", async () => {
    await POST(signedRequest(completedEvent("evt_14a", orderId, 1)));
    await POST(signedRequest(completedEvent("evt_14b", orderId, 5000, "cs_someone_else")));

    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("PENDING");
    expect(product.stock).toBe(8);
  });

  it("records the event id so a replay is recognised", async () => {
    await POST(signedRequest(completedEvent("evt_8", orderId, 5000)));

    const recorded = await db.processedWebhookEvent.findUnique({ where: { id: "evt_8" } });
    expect(recorded).not.toBeNull();
  });

  it("leaves no trace when an expiry fails mid-way, and handles the redelivery in full", async () => {
    const event = expiredEvent("evt_10", orderId);
    vi.mocked(releaseOrderReservationIn).mockRejectedValueOnce(new Error("boom"));

    await expect(POST(signedRequest(event))).rejects.toThrow("boom");

    expect(await db.processedWebhookEvent.count()).toBe(0);
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);

    expect((await POST(signedRequest(event))).status).toBe(200);

    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("CANCELLED");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
    expect(await db.processedWebhookEvent.findUnique({ where: { id: "evt_10" } })).not.toBeNull();
  });

  it("leaves no trace when a completed event fails mid-way, and handles the redelivery in full", async () => {
    const event = completedEvent("evt_11", orderId, 5000);
    // Stan magazynowy jest aktualizowany w transakcji, więc psujemy go przez `tx`.
    type Run = (fn: (tx: Tx) => Promise<unknown>) => Promise<unknown>;
    const original = db.$transaction.bind(db) as Run;
    const transaction = vi.spyOn(db, "$transaction").mockImplementationOnce(((fn: Parameters<Run>[0]) =>
      original((tx) =>
        fn(
          new Proxy(tx, {
            get: (target, key) =>
              key === "product" ? { update: () => Promise.reject(new Error("boom")) } : Reflect.get(target, key),
          })
        )
      )) as never);

    await expect(POST(signedRequest(event))).rejects.toThrow("boom");
    transaction.mockRestore();

    expect(await db.processedWebhookEvent.count()).toBe(0);
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");

    expect((await POST(signedRequest(event))).status).toBe(200);

    expect((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
    expect(await db.processedWebhookEvent.findUnique({ where: { id: "evt_11" } })).not.toBeNull();
  });

  it("returns 200 and restocks once for two concurrent deliveries of the same event", async () => {
    const event = expiredEvent("evt_12", orderId);

    const responses = await Promise.all([POST(signedRequest(event)), POST(signedRequest(event))]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
  });

  it("acknowledges unrelated event types without recording them", async () => {
    const response = await POST(
      signedRequest({ id: "evt_9", type: "customer.created", data: { object: {} } })
    );

    expect(response.status).toBe(200);
    expect(await db.processedWebhookEvent.count()).toBe(0);
  });
});
