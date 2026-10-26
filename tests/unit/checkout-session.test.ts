import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionsCreate, orderUpdate } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  orderUpdate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: sessionsCreate } };
    coupons = { create: vi.fn() };
  },
}));
vi.mock("@/lib/db", () => ({ db: { order: { update: orderUpdate } } }));

import { createCheckoutSession } from "@/lib/checkout-session";

const order = {
  id: "order_1",
  discountAmount: 0,
  items: [{ quantity: 1, price: 10, product: { name: "Widget" } }],
};

beforeEach(() => vi.clearAllMocks());

describe("createCheckoutSession: live-mode session", () => {
  it("throws and does not save the session id", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_live_1", livemode: true, url: "https://x" });
    await expect(createCheckoutSession(order, { cancelUrl: "https://c" })).rejects.toThrow(
      "live-mode session"
    );
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("saves the session id for a test-mode session", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_test_1", livemode: false, url: "https://x" });
    await expect(createCheckoutSession(order, { cancelUrl: "https://c" })).resolves.toBe("https://x");
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { stripeSessionId: "cs_test_1" },
    });
  });
});
