// Minimalne dane dla testów E2E: jeden zweryfikowany użytkownik i jeden produkt
// na stanie. Celowo nie używamy prisma/seed.ts — testy mają zależeć od danych,
// które same kontrolują, a nie od zawartości katalogu demonstracyjnego.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import bcrypt from "bcrypt";
import { E2E_ADMIN, E2E_PRODUCT, E2E_USER } from "./fixtures";

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

  await db.user.create({
    data: {
      email: E2E_ADMIN.email,
      name: E2E_ADMIN.name,
      password: await bcrypt.hash(E2E_ADMIN.password, 10),
      emailVerified: new Date(),
      role: "ADMIN",
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
