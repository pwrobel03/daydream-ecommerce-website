import { existsSync } from "fs";
import { mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createPrismaClient } from "@/lib/db";
import { applyReset, previewReset } from "@/scripts/demo-reset";
import { categories } from "@/prisma/data/categories";
import { products } from "@/prisma/data/products";
import { users } from "@/prisma/data/users";
import { resetDatabase } from "./reset";

const db = createPrismaClient();
const uploadDir = path.resolve(process.env.UPLOAD_DIR!);

// The seed draws review and order counts at random; a fixed value makes two runs comparable.
vi.spyOn(Math, "random").mockReturnValue(0.5);
vi.spyOn(console, "log").mockImplementation(() => {});

const rowCounts = async () => ({
  users: await db.user.count(),
  accounts: await db.account.count(),
  addresses: await db.address.count(),
  categories: await db.category.count(),
  statuses: await db.status.count(),
  ingredients: await db.ingredient.count(),
  products: await db.product.count(),
  productImages: await db.productImage.count(),
  reviews: await db.review.count(),
  orders: await db.order.count(),
  orderItems: await db.orderItem.count(),
  sales: await db.sale.count(),
  verificationTokens: await db.verificationToken.count(),
  passwordResetTokens: await db.passwordResetToken.count(),
  webhookEvents: await db.processedWebhookEvent.count(),
});

let adminHash: string;

beforeAll(async () => {
  // Other suites leave their ADMIN users behind; this one counts only its own.
  await resetDatabase(db);
  await db.user.deleteMany({ where: { role: "ADMIN" } });

  const admin = await db.user.create({
    data: {
      email: "private-admin@example.com",
      role: "ADMIN",
      password: "$2b$12$abcdefghijklmnopqrstuuJ8rUQ6a1oHhCq6v0nHcz3H0R3y4m8XW",
      address: {
        create: { fullName: "Owner", street: "Main 1", city: "Kraków", zipCode: "30-001", phone: "+48 600 000 000" },
      },
      accounts: { create: { type: "oauth", provider: "github", providerAccountId: "owner" } },
    },
  });
  adminHash = admin.password!;
});

afterAll(async () => {
  // Leave the shared database as later suites expect it: no catalogue, no seeded customers.
  await resetDatabase(db);
  await db.status.deleteMany();
  await db.ingredient.deleteMany();
  await db.user.deleteMany();
  await db.address.deleteMany();
  await db.$disconnect();
});

describe("demo reset", () => {
  it("previews the extra data, then restores the seed state twice while keeping the ADMIN", async () => {
    await applyReset();
    const seedState = await rowCounts();
    expect(seedState).toMatchObject({
      users: users.length + 2, // the sample customers, the demo admin and the private admin
      accounts: 1,
      addresses: users.length + 1,
      categories: categories.length,
      products: products.length,
      sales: 0,
    });

    const customer = await db.user.create({
      data: { email: "visitor@example.com", role: "USER" },
    });
    await db.order.create({ data: { userId: customer.id, totalAmount: 10, status: "PENDING" } });
    const extra = await db.product.create({ data: { name: "Extra", slug: "extra-product", price: 10 } });
    await db.review.create({ data: { userId: customer.id, productId: extra.id, content: "Nice" } });
    await db.verificationToken.create({
      data: { email: "visitor@example.com", token: "t1", expires: new Date() },
    });
    await db.processedWebhookEvent.create({ data: { id: "evt_1", type: "checkout.session.completed" } });
    await mkdir(path.join(uploadDir, "products", "x"), { recursive: true });
    await writeFile(path.join(uploadDir, "products", "x", "a.webp"), "image");

    const before = await rowCounts();
    const preview = await previewReset();
    const seededPending = await db.order.count({ where: { status: "PENDING", user: { email: { not: "visitor@example.com" } } } });

    expect(preview).toMatchObject({
      customers: users.length + 1,
      unverified: 1,
      extraProducts: 1,
      extraCategories: 0,
      voices: seedState.reviews + 1,
      uploadFiles: 1,
    });
    expect(preview.ordersByStatus.PENDING).toBe(seededPending + 1);
    expect(await rowCounts()).toEqual(before);

    await applyReset();
    expect(await rowCounts()).toEqual(seedState);
    expect(existsSync(uploadDir)).toBe(true);
    expect(await readdir(uploadDir)).toEqual([]);

    await applyReset();
    expect(await rowCounts()).toEqual(seedState);

    const admin = await db.user.findUniqueOrThrow({
      where: { email: "private-admin@example.com" },
      include: { accounts: true, address: true },
    });
    expect(admin.password).toBe(adminHash);
    expect(admin.accounts).toHaveLength(1);
    expect(admin.address?.fullName).toBe("Owner");
  });
});
