import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectFail } from "../helpers/action-result";
import { resetDatabase } from "./reset";

// Real database, only the session is replaced: the demo admin must be refused
// by every admin write and leave the data untouched.
const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "demo-admin", role: "DEMO_ADMIN" as string } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { upsertProduct, deleteProduct } = await import("@/actions/admin/inventory");
const { createCategory, deleteCategory, getCategories } = await import("@/actions/admin/categories");
const { upsertIngredient, deleteIngredient } = await import("@/actions/admin/ingredients");
const { updateOrderStatus } = await import("@/actions/admin/orders");
const { deleteVoice } = await import("@/actions/admin/reviews");
const { requireAdmin, requireBackOffice } = await import("@/lib/guards");

afterAll(async () => {
  await db.$disconnect();
});

let ids: { product: string; category: string; ingredient: string; order: string; review: string };

const snapshot = async () => ({
  products: await db.product.findMany({ orderBy: { id: "asc" } }),
  categories: await db.category.findMany({ orderBy: { id: "asc" } }),
  ingredients: await db.ingredient.findMany({ orderBy: { id: "asc" } }),
  orders: await db.order.findMany({ orderBy: { id: "asc" } }),
  reviews: await db.review.findMany({ orderBy: { id: "asc" } }),
});

beforeAll(async () => {
  await db.user.create({
    data: { id: "demo-admin", email: "demo-admin-test@example.com", role: "DEMO_ADMIN" },
  });
});

beforeEach(async () => {
  session.user.role = "DEMO_ADMIN";
  await resetDatabase(db);
  await db.ingredient.deleteMany();
  await db.category.deleteMany();

  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  const category = await db.category.create({ data: { name: "Cat", slug: `cat-${Date.now()}` } });
  const ingredient = await db.ingredient.create({ data: { name: `Ing-${Date.now()}` } });
  const order = await db.order.create({ data: { userId: "demo-admin", totalAmount: 25 } });
  const review = await db.review.create({
    data: { userId: "demo-admin", productId: product.id, content: "Nice" },
  });
  ids = {
    product: product.id,
    category: category.id,
    ingredient: ingredient.id,
    order: order.id,
    review: review.id,
  };
});

describe("DEMO_ADMIN", () => {
  it("is refused by every admin write and changes nothing", async () => {
    const before = await snapshot();

    const form = new FormData();
    form.set("name", "Hacked");
    const results = [
      await upsertProduct(ids.product, form),
      await upsertProduct("new", form),
      await deleteProduct(ids.product),
      await createCategory(form),
      await deleteCategory(ids.category),
      await upsertIngredient(ids.ingredient, form),
      await upsertIngredient("new", form),
      await deleteIngredient(ids.ingredient),
      await updateOrderStatus(ids.order, "CANCELLED"),
      await deleteVoice(ids.review),
    ];

    for (const result of results) expectFail(result, "FORBIDDEN");
    expect(JSON.stringify(await snapshot())).toBe(JSON.stringify(before)); // Decimal instances do not deep-equal
  });

  it("explains the refusal with the read-only message", async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ code: "FORBIDDEN", message: "demoReadOnly" });
  });

  it("may use the back-office reads", async () => {
    await expect(requireBackOffice()).resolves.toBeTruthy();
    expect(await getCategories()).toHaveLength(1);
  });

  it("is not let in by a plain USER session", async () => {
    session.user.role = "USER";
    await expect(requireBackOffice()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
