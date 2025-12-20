// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Czyszczenie bazy danych...");
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.status.deleteMany(); // DODANE: Czyszczenie nowej tabeli
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Tworzenie użytkownika testowego...");
  const testUser = await prisma.user.create({
    data: { name: "Jan Kowalski", email: "jan@example.com", role: "USER" },
  });

  console.log("🏷️ Tworzenie statusów..."); // DODANE: Nowa sekcja
  const sNew = await prisma.status.create({ data: { name: "Nowość", slug: "new", color: "#10b981" } });
  const sHot = await prisma.status.create({ data: { name: "Hit", slug: "hot", color: "#f97316" } });
  const sSale = await prisma.status.create({ data: { name: "Wyprzedaż", slug: "sale", color: "#ef4444" } });

  console.log("🌱 Tworzenie składników...");
  const ingredients = await Promise.all([
    prisma.ingredient.create({ data: { name: "Dark Chocolate", image: "/ingredients/dark-chocolate.png" } }),
    prisma.ingredient.create({ data: { name: "Roasted Almonds", image: "/ingredients/almonds.png" } }),
    prisma.ingredient.create({ data: { name: "Organic Honey", image: "/ingredients/honey.png" } }),
    prisma.ingredient.create({ data: { name: "Dried Cranberries", image: "/ingredients/almonds.png" } }),
    prisma.ingredient.create({ data: { name: "Pumpkin Seeds", image: "/ingredients/dark-chocolate.png" } }),
    prisma.ingredient.create({ data: { name: "Coconut Flakes", image: "/ingredients/almonds.png" } }),
    prisma.ingredient.create({ data: { name: "Chia Seeds", image: "/ingredients/honey.png" } }),
  ]);

  console.log("🌱 Tworzenie kategorii...");
  const muesli = await prisma.category.create({ data: { name: "Muesli", slug: "muesli", image: "/categories/muesli.png" } });
  const granola = await prisma.category.create({ data: { name: "Granola", slug: "granola", image: "/categories/granola.png" } });
  const keto = await prisma.category.create({ data: { name: "KETO", slug: "keto", image: "/categories/keto-special.png" } });
  const chocoMuesli = await prisma.category.create({ data: { name: "Chocolate Muesli", slug: "chocolate-muesli", parentId: muesli.id } });

  console.log("🏷️ Tworzenie promocji (Sales)...");
  await prisma.sale.createMany({
    data: [
      { name: "Witaj", couponCode: "START20", discountValue: 20, validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log("🥣 Tworzenie 10 produktów...");
  const productConfigs = [
    // DODANE: promoPrice i statusId w konfiguracji
    { name: "Choco-Almond Dream", slug: "choco-almond", price: 24.99, promoPrice: 19.99, statusId: sSale.id, cat: [muesli.id, chocoMuesli.id], ing: [0, 1] },
    { name: "Honey Nut Crunch", slug: "honey-nut", price: 29.99, promoPrice: null, statusId: sNew.id, cat: [granola.id], ing: [2, 1, 4] },
    { name: "Keto Berry Blast", slug: "keto-berry", price: 34.99, promoPrice: 28.50, statusId: sHot.id, cat: [keto.id], ing: [3, 4, 5] },
    { name: "Tropical Coconut", slug: "tropical-coconut", price: 27.50, promoPrice: null, statusId: null, cat: [granola.id], ing: [5, 2] },
    { name: "Double Dark Choco", slug: "double-dark", price: 31.00, promoPrice: 25.00, statusId: sSale.id, cat: [granola.id, chocoMuesli.id], ing: [0, 6] },
    { name: "Morning Energy Mix", slug: "morning-energy", price: 19.99, promoPrice: null, statusId: sNew.id, cat: [muesli.id], ing: [2, 3, 6] },
    { name: "Almond Joy Keto", slug: "almond-keto", price: 38.00, promoPrice: 32.99, statusId: sHot.id, cat: [keto.id], ing: [1, 5] },
    { name: "Cranberry Zen", slug: "cranberry-zen", price: 22.00, promoPrice: null, statusId: null, cat: [muesli.id], ing: [3, 4] },
    { name: "Pumpkin Power", slug: "pumpkin-power", price: 25.99, promoPrice: null, statusId: null, cat: [muesli.id], ing: [4, 2] },
    { name: "Chia Master", slug: "chia-master", price: 28.00, promoPrice: 15.99, statusId: sSale.id, cat: [muesli.id, keto.id], ing: [6, 5, 3] },
  ];

  for (const p of productConfigs) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: `Wyjątkowy produkt ${p.name}.`,
        price: p.price,
        promoPrice: p.promoPrice,
        statusId: p.statusId,
        weight: "500g",
        stock: Math.floor(Math.random() * 50) + 10,
        categories: { connect: p.cat.map(id => ({ id })) },
        ingredients: { connect: p.ing.map(idx => ({ id: ingredients[idx].id })) },
        images: { create: [{ url: `/products/main.png` }, { url: `/products/side.png` }] }
      }
    });

    await prisma.review.create({
      data: {
        content: `Świetny produkt! Mój ulubiony to ${p.name}.`,
        rating: 5,
        userId: testUser.id,
        productId: product.id,
      }
    });
  }

  console.log("✅ Baza danych została zasilona!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });