import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectFail, expectOk } from "../helpers/action-result";
import { resetDatabase } from "./reset";

// Real database, only the session is replaced: Voices are editable by their author alone.
const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "voice-a", role: "USER" as string } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { createReview, updateReview, deleteReview } = await import("@/actions/store/reviews");

let productId: string;
let reviewId: string;

const stored = () => db.review.findUnique({ where: { id: reviewId } });

beforeAll(async () => {
  for (const id of ["voice-a", "voice-b"]) {
    await db.user.upsert({
      where: { id },
      update: {},
      create: { id, email: `${id}-test@example.com`, role: "USER" },
    });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  session.user.id = "voice-a";
  await resetDatabase(db);
  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  productId = product.id;
  const review = await db.review.create({
    data: { userId: "voice-a", productId, rating: 3, content: "Original story" },
  });
  reviewId = review.id;
});

describe("updateReview validation", () => {
  it.each([
    ["rating 0", { rating: 0, content: "Fine story" }],
    ["rating 6", { rating: 6, content: "Fine story" }],
    ["rating 4.5", { rating: 4.5, content: "Fine story" }],
    ["empty content", { rating: 4, content: "" }],
    ["content over 2000 characters", { rating: 4, content: "x".repeat(2001) }],
  ])("rejects %s and leaves the Voice unchanged", async (_name, values) => {
    const before = await stored();
    expectFail(await updateReview(reviewId, values, "bar"), "INVALID_INPUT");
    expect(await stored()).toEqual(before);
  });
});

describe("Voice ownership", () => {
  it("refuses another user's update and delete", async () => {
    session.user.id = "voice-b";
    const before = await stored();

    expect((await updateReview(reviewId, { rating: 1, content: "Hijacked" }, "bar")).ok).toBe(false);
    expect((await deleteReview(reviewId, "bar")).ok).toBe(false);

    expect(await stored()).toEqual(before);
  });

  it("lets the owner update and delete", async () => {
    const { review } = expectOk(await updateReview(reviewId, { rating: 5, content: "Updated story" }, "bar"));
    expect(review.rating).toBe(5);
    expect(await stored()).toMatchObject({ rating: 5, content: "Updated story" });

    expectOk(await deleteReview(reviewId, "bar"));
    expect(await stored()).toBeNull();
  });

  it("signs a new Voice with the session user, ignoring a userId in the payload", async () => {
    session.user.id = "voice-b";
    const forged = { productId, rating: 4, content: "My own story", userId: "voice-a" };
    const { review } = expectOk(await createReview(forged));
    const row = await db.review.findUnique({ where: { id: review.id } });
    expect(row?.userId).toBe("voice-b");
  });
});
