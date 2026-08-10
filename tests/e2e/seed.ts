// Minimalne dane dla testów E2E: jeden zweryfikowany użytkownik i jeden produkt
// na stanie. Celowo nie używamy prisma/seed.ts — testy mają zależeć od danych,
// które same kontrolują, a nie od zawartości katalogu demonstracyjnego.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import bcrypt from "bcrypt";

export const E2E_USER = {
  email: "e2e@example.com",
  password: "e2e-password-123",
  name: "E2E Buyer",
};

export const E2E_PRODUCT = {
  name: "Test Bar",
  slug: "test-bar",
  price: 20,
  stock: 25,
};

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  await db.user.create({
    data: {
      email: E2E_USER.email,
      name: E2E_USER.name,
      password: await bcrypt.hash(E2E_USER.password, 10),
      emailVerified: new Date(),
    },
  });

  const category = await db.category.create({
    data: { name: "Bars", slug: "bars" },
  });

  await db.product.create({
    data: {
      ...E2E_PRODUCT,
      description: "A bar used by the end-to-end tests.",
      categories: { connect: { id: category.id } },
    },
  });

  await db.$disconnect();
}

main();
