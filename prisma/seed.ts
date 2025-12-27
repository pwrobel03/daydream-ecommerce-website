// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

import { users } from "./data/users";
import { categories } from "./data/categories";
import { statuses } from "./data/statuses";
import { ingredients } from "./data/ingredients";
import { products } from "./data/products";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 System Purge: Cleaning Nexus Database...");

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

  console.log("👥 Synthesizing User Identities...");
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

  console.log("💎 Forging Artifacts (Multi-Category Support)...");
  for (const p of products) {
    // SZUKANIE WIELU KATEGORII
    const matchedCats = createdCats.filter(c => p.categorySlugs.includes(c.slug));
    const stat = createdStats.find(s => s.slug === p.statusSlug);

    if (matchedCats.length === 0) {
      console.warn(`⚠️ Warning: No valid categories found for product "${p.name}". Required slugs: ${p.categorySlugs.join(", ")}`);
    }

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
        
        // POPRAWKA: Connect dla wielu kategorii naraz
        categories: {
          connect: matchedCats.map(cat => ({ id: cat.id }))
        },

        ingredients: {
          connect: createdIngs
            .filter(ing => p.ingredientNames.includes(ing.name))
            .map(ing => ({ id: ing.id }))
        },

        images: {
          create: p.images.map((url) => ({
            url: url
          }))
        }
      }
    });

    console.log(`✅ Artifact Created: ${product.name} (linked to ${matchedCats.length} categories)`);

    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await prisma.review.create({
      data: {
        content: "Integration complete. Artifact quality exceeds expectations.",
        rating: 5,
        userId: randomUser.id,
        productId: product.id
      }
    });
  }

  console.log("\n✨ NEXUS DATABASE SYNCHRONIZED ✨\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });