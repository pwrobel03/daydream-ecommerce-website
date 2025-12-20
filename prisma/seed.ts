import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning database...");
  await prisma.productImage.deleteMany();
  await prisma.sale.deleteMany();
  // Czyścimy relacje wiele-do-wielu i produkty
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();

  console.log("🌱 Seeding Ingredients...");
  const darkChocolate = await prisma.ingredient.create({
    data: { name: "Dark Chocolate", image: "/ingredients/dark-chocolate.png" },
  });
  const roastedAlmonds = await prisma.ingredient.create({
    data: { name: "Roasted Almonds", image: "/ingredients/almonds.png" },
  });
  const organicHoney = await prisma.ingredient.create({
    data: { name: "Organic Honey", image: "/ingredients/honey.png" },
  });

  console.log("🌱 Seeding Categories...");
  // Główne kategorie
  const muesli = await prisma.category.create({
    data: {
      name: "Muesli",
      slug: "muesli",
      image: "/categories/muesli-main.png",
      description: "Natural, raw grain mixes for a perfect start.",
    },
  });

  const granola = await prisma.category.create({
    data: {
      name: "Granola",
      slug: "granola",
      image: "/categories/granola-main.png",
      description: "Crunchy, oven-baked goodness with honey and nuts.",
    },
  });

  const oats = await prisma.category.create({
    data: {
      name: "Oats",
      slug: "oats",
      image: "/categories/oats-main.png",
      description: "Simple, pure and high-fiber oat flakes.",
    },
  });

  // Specjalistyczna kategoria (KETO)
  const keto = await prisma.category.create({
    data: {
      name: "KETO Friendly",
      slug: "keto",
      image: "/categories/keto-special.png",
      description: "Low carb, high healthy fats selections.",
    },
  });

  // Podkategoria
  const chocoMuesli = await prisma.category.create({
    data: {
      name: "Chocolate Muesli",
      slug: "chocolate-muesli",
      parentId: muesli.id,
      description: "For those who love a sweet morning.",
    },
  });

  console.log("🌱 Seeding Products...");
  await prisma.product.create({
    data: {
      name: "Choco-Almond Dream Muesli",
      slug: "choco-almond-dream",
      description: "Our signature muesli blend with 70% dark chocolate and crunchy almonds.",
      price: 24.99,
      weight: "500g",
      stock: 50,
      categories: { connect: [{ id: muesli.id }, { id: chocoMuesli.id }, { id: keto.id }] },
      ingredients: { connect: [{ id: darkChocolate.id }, { id: roastedAlmonds.id }] },
      images: {
        create: [
          { url: "/products/muesli-1-main.png" },
          { url: "/products/muesli-1-side.png" },
          { url: "/products/muesli-1-texture.png" },
        ],
      },
    },
  });

  console.log("🌱 Seeding Sales (Promotional Codes)...");
  await prisma.sale.createMany({
    data: [
      {
        name: "Dreamy Welcome",
        couponCode: "DREAMY20",
        discountValue: 20,
        description: "Start your journey with DayDream. Get 20% off!",
        image: "/sales/dreamy20.png",
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Golden Crunch Time",
        couponCode: "GOLDEN-CRUNCH",
        discountValue: 25,
        description: "Experience the ultimate granola crunch.",
        image: "/sales/golden-crunch.png",
        validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });