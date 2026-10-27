// Minimalne dane dla testów E2E: jeden zweryfikowany użytkownik i jeden produkt
// na stanie. Celowo nie używamy prisma/seed.ts — testy mają zależeć od danych,
// które same kontrolują, a nie od zawartości katalogu demonstracyjnego.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import bcrypt from "bcrypt";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  E2E_ADMIN,
  E2E_BULK_REVIEWS,
  E2E_PRODUCT,
  E2E_REVIEWS,
  E2E_USER,
} from "./fixtures";

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

  await db.user.create({
    data: {
      email: DEMO_ADMIN_EMAIL,
      name: "Demo Admin",
      password: await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10),
      emailVerified: new Date(),
      role: "DEMO_ADMIN",
    },
  });

  const category = await db.category.create({
    data: { name: "Bars", slug: "bars" },
  });
  // A second category, so the home page renders a collapsed card for the a11y scan.
  await db.category.create({ data: { name: "Granola", slug: "granola" } });

  const product = await db.product.create({
    data: {
      ...E2E_PRODUCT,
      description: "A bar used by the end-to-end tests.",
      categories: { connect: { id: category.id } },
    },
  });

  // Dwie opinie o różnych ocenach — panel moderacji filtruje po ocenie,
  // więc jedna nie odróżniłaby działającego filtra od zignorowanego.
  // Wypełniacz powstaje pierwszy, żeby dwie nazwane opinie były najświeższe —
  // panel moderacji sortuje malejąco po dacie i pokazuje pierwszą dziesiątkę.
  // Powyżej progu `take: 9`, którym strona produktu dociąga listę opinii.
  for (const [index, review] of E2E_BULK_REVIEWS.entries()) {
    const author = await db.user.create({
      data: {
        email: `filler-${index}@example.com`,
        name: `Filler ${index}`,
        emailVerified: new Date(),
      },
    });

    await db.review.create({
      data: { ...review, productId: product.id, userId: author.id },
    });
  }

  for (const review of E2E_REVIEWS) {
    const author = await db.user.create({
      data: {
        email: `voice-${review.rating}-${Date.now()}@example.com`,
        name: `Voice ${review.rating}`,
        emailVerified: new Date(),
      },
    });

    await db.review.create({
      data: { ...review, productId: product.id, userId: author.id },
    });
  }

  await db.$disconnect();
}

main();
