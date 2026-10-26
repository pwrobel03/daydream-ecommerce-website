// prisma/seed.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log("🧹 System Purge: Cleaning Nexus Database...");

  // Kolejność usuwania: najpierw dzieci, potem rodzice
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.status.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  await seedDatabase(prisma);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
