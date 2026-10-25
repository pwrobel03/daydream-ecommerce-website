// prisma/seed-data.ts
// The seed state, shared by prisma/seed.ts and the demo reset (ADR 0010).

import { Prisma, OrderStatus } from "../lib/generated/prisma/client";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../lib/demo";

import { users } from "./data/users";
import { categories } from "./data/categories";
import { statuses } from "./data/statuses";
import { ingredients } from "./data/ingredients";
import { products } from "./data/products";
import { reviewTemplates } from "./data/reviews";

/** Inserts the seed data. Expects the seeded tables to be empty. */
export async function seedDatabase(tx: Prisma.TransactionClient): Promise<void> {
  console.log(`👥 Synthesizing ${users.length} User Identities...`);
  const now = new Date();

  // Public, read-only account. The seed creates no ADMIN (ADR 0011).
  await tx.user.create({
    data: {
      name: "Demo Admin",
      email: DEMO_ADMIN_EMAIL,
      password: await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12),
      role: "DEMO_ADMIN",
      emailVerified: now,
    }
  });

  const createdUsers = [];
  for (const u of users) {
    // Sample customers exist only to own the seeded orders; nobody knows their password.
    const password = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
    const addr = await tx.address.create({ data: u.address });
    const user = await tx.user.create({
      data: {
        name: u.name,
        email: u.email,
        password,
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
      tx.category.create({
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
  const createdStats = await Promise.all(statuses.map(s => tx.status.create({ data: s })));
  const createdIngs = await Promise.all(ingredients.map(i => tx.ingredient.create({ data: i })));

  console.log("💎 Forging Artifacts & Reviews...");
  const createdProducts = [];
  for (const p of products) {
    const matchedCats = createdCats.filter(c => p.categorySlugs.includes(c.slug));
    const stat = createdStats.find(s => s.slug === p.statusSlug);

    const product = await tx.product.create({
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
      await tx.review.create({
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
      const order = await tx.order.create({
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

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: quantity,
            price: priceAtPurchase,
          }
        });
      }

      // Aktualizujemy kwotę całkowitą zamówienia
      await tx.order.update({
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
