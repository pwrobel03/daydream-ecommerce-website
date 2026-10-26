/**
 * Previews or applies the demo reset (ADR 0010).
 *
 *   npx tsx scripts/demo-reset.ts --preview   prints what a reset would delete, changes nothing
 *   npx tsx scripts/demo-reset.ts --apply     restores the seed state, keeping ADMIN users
 *
 * Run through scripts/demo-reset.sh, which dumps the database and asks for confirmation first.
 */
import { readdir, rm } from "fs/promises";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { OrderStatus, PrismaClient } from "../lib/generated/prisma/client";
import { seedDatabase } from "../prisma/seed-data";
import { categories } from "../prisma/data/categories";
import { products } from "../prisma/data/products";

export type ResetPreview = {
  customers: number;
  unverified: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  addresses: number;
  voices: number;
  extraProducts: number;
  extraCategories: number;
  uploadFiles: number;
};

// The seed's bcrypt hashes and a few hundred inserts take several seconds; the default is 5 s.
const RESET_TIMEOUT_MS = 120_000;

const keptAdmins = { role: "ADMIN" } as const;

function newClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

function uploadDir() {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) throw new Error("UPLOAD_DIR is not set");
  return path.resolve(dir);
}

async function countFiles(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).length;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
}

export async function previewReset(): Promise<ResetPreview> {
  const dir = uploadDir();
  const db = newClient();
  try {
    const [customers, unverified, orders, addresses, voices, extraProducts, extraCategories] =
      await Promise.all([
        db.user.count({ where: { role: "USER" } }),
        db.user.count({ where: { emailVerified: null, NOT: keptAdmins } }),
        db.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
        db.address.count({ where: { OR: [{ user: null }, { user: { NOT: keptAdmins } }] } }),
        db.review.count(),
        db.product.count({ where: { slug: { notIn: products.map((p) => p.slug) } } }),
        db.category.count({ where: { slug: { notIn: categories.map((c) => c.slug) } } }),
      ]);

    return {
      customers,
      unverified,
      ordersByStatus: Object.fromEntries(orders.map((o) => [o.status, o._count._all])),
      addresses,
      voices,
      extraProducts,
      extraCategories,
      uploadFiles: await countFiles(dir),
    };
  } finally {
    await db.$disconnect();
  }
}

export async function applyReset(): Promise<void> {
  // Resolved before the transaction, so a missing setting cannot fail after the commit.
  const dir = uploadDir();
  const db = newClient();
  try {
    await db.$transaction(
      async (tx) => {
        await tx.processedWebhookEvent.deleteMany();
        await tx.verificationToken.deleteMany();
        await tx.passwordResetToken.deleteMany();
        await tx.review.deleteMany();
        await tx.orderItem.deleteMany();
        await tx.order.deleteMany();
        await tx.sale.deleteMany();
        await tx.productImage.deleteMany();
        await tx.product.deleteMany();
        await tx.category.deleteMany();
        await tx.status.deleteMany();
        await tx.ingredient.deleteMany();
        // Account rows go with their users by cascade.
        await tx.user.deleteMany({ where: { NOT: keptAdmins } });
        await tx.address.deleteMany({ where: { user: null } });

        await seedDatabase(tx);
      },
      { timeout: RESET_TIMEOUT_MS },
    );
  } finally {
    await db.$disconnect();
  }

  // Seed images ship under public/static/, so everything here was uploaded after the seed.
  const entries = await readdir(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  await Promise.all(entries.map((entry) => rm(path.join(dir, entry), { recursive: true, force: true })));
}

function printPreview(counts: ResetPreview) {
  const lines = [
    `Customer accounts (USER): ${counts.customers}`,
    `Unverified accounts: ${counts.unverified}`,
    ...Object.values(OrderStatus).map((status) => `Orders ${status}: ${counts.ordersByStatus[status] ?? 0}`),
    `Addresses: ${counts.addresses}`,
    `Voices: ${counts.voices}`,
    `Products not in the seed: ${counts.extraProducts}`,
    `Categories not in the seed: ${counts.extraCategories}`,
    `Files in UPLOAD_DIR: ${counts.uploadFiles}`,
  ];
  console.log(lines.join("\n"));
}

const USAGE = "Usage: npx tsx scripts/demo-reset.ts --preview | --apply";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--preview") {
    printPreview(await previewReset());
  } else if (args.length === 1 && args[0] === "--apply") {
    await applyReset();
    console.log("Demo reset applied.");
  } else {
    console.error(USAGE);
    process.exit(2);
  }
}

if (process.argv[1]?.endsWith("demo-reset.ts")) {
  main().catch((error) => {
    console.error(`demo-reset failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
