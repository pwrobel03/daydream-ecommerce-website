// prisma/seed.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, OrderStatus } from "../lib/generated/prisma/client";
import bcrypt from "bcrypt";

import { users } from "./data/users";
import { categories } from "./data/categories";
import { statuses } from "./data/statuses";
import { ingredients } from "./data/ingredients";
import { products } from "./data/products";
import { reviewTemplates } from "./data/reviews";

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

  console.log(`👥 Synthesizing ${users.length} User Identities...`);
  const hashedPassword = await bcrypt.hash("password123", 12);
  const now = new Date();

  const createdUsers = [];
  for (const u of users) {
    const addr = await prisma.address.create({ data: u.address });
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        emailVerified: now,
        addressId: addr.id,
      }
    });
    createdUsers.push(user);
  }

  console.log("📂 Mapping Categories...");
  const createdCats = await Promise.all(
    categories.map((c) =>
      prisma.category.create({
        data: {
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image || null,
        },
      })
    )
  );

  console.log("🏷️ Forging Statuses & Ingredients...");
  const createdStats = await Promise.all(statuses.map(s => prisma.status.create({ data: s })));
  const createdIngs = await Promise.all(ingredients.map(i => prisma.ingredient.create({ data: i })));

  console.log("💎 Forging Artifacts & Reviews...");
  const createdProducts = [];
  for (const p of products) {
    const matchedCats = createdCats.filter(c => p.categorySlugs.includes(c.slug));
    const stat = createdStats.find(s => s.slug === p.statusSlug);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        promoPrice: p.promoPrice,
        weight: p.weight,
        stock: p.stock,
        statusId: stat?.id || null,
        categories: { connect: matchedCats.map(cat => ({ id: cat.id })) },
        ingredients: {
          connect: createdIngs
            .filter(ing => p.ingredientNames.includes(ing.name))
            .map(ing => ({ id: ing.id }))
        },
        images: { create: p.images.map((url) => ({ url })) }
      }
    });
    createdProducts.push(product);

    // Dodawanie recenzji
    const reviewCount = Math.floor(Math.random() * 6) + 10;
    const selectedUsers = [...createdUsers].sort(() => 0.5 - Math.random()).slice(0, reviewCount);

    for (const user of selectedUsers) {
      const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
      const dynamicContent = template.content.replace(/{productName}/g, product.name);
      await prisma.review.create({
        data: {
          content: dynamicContent,
          rating: template.rating,
          userId: user.id,
          productId: product.id
        }
      });
    }
  }

  // --- NOWA SEKCJA: GENEROWANIE ZAMÓWIEŃ (ORDERS) ---
  console.log("📦 Generating Logistics History (Orders)...");
  
  const possibleStatuses: OrderStatus[] = ["PAID", "DELIVERED", "SHIPPED", "PENDING"];

  for (const user of createdUsers) {
    // Każdy użytkownik ma od 2 do 4 zamówień
    const orderCount = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < orderCount; i++) {
      // Każde zamówienie ma od 1 do 5 różnych produktów
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const shuffledProducts = [...createdProducts].sort(() => 0.5 - Math.random()).slice(0, itemCount);
      
      const status = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      const isPaid = status === "PAID" || status === "DELIVERED" || status === "SHIPPED";

      // Tworzymy zamówienie
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          addressId: user.addressId, // Korzystamy z przypisaného adresu użytkownika
          status: status,
          isPaid: isPaid,
          totalAmount: 0, // Zaktualizujemy za chwilę
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)), // Losowa data z przeszłości
        }
      });

      let calculatedTotal = 0;

      // Dodajemy przedmioty do zamówienia
      for (const product of shuffledProducts) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const priceAtPurchase = product.promoPrice ? product.promoPrice : product.price;
        const subtotal = Number(priceAtPurchase) * quantity;
        calculatedTotal += subtotal;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: quantity,
            price: priceAtPurchase,
          }
        });
      }

      // Aktualizujemy kwotę całkowitą zamówienia
      await prisma.order.update({
        where: { id: order.id },
        data: { totalAmount: calculatedTotal }
      });
    }
  }

  console.log(`\n✨ NEXUS DATABASE SYNCHRONIZED ✨`);
  console.log(`✅ ${createdUsers.length} Users active.`);
  console.log(`✅ ${createdProducts.length} Artifacts forged.`);
  console.log(`✅ History of logistics established.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });