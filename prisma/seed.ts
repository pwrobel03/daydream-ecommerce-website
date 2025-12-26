import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Czyszczenie bazy danych (zachowując kolejność relacji)...");
  
  // 1. Najpierw usuwamy tabele zależne (dzieci)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  
  // 2. Potem tabele główne (rodzice)
  await prisma.sale.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.status.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Tworzenie użytkownika testowego...");
  const testUser = await prisma.user.create({
    data: { 
        name: "Jan Kowalski", 
        email: "jan@example.com", 
        role: "ADMIN" // Zmieniam na ADMIN, żebyś mógł testować dashboard
    },
  });

  console.log("🏷️ Tworzenie statusów...");
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

  console.log("📂 Tworzenie kategorii...");
  const muesli = await prisma.category.create({ data: { name: "Muesli", slug: "muesli", image: "/categories/muesli.png" } });
  const granola = await prisma.category.create({ data: { name: "Granola", slug: "granola", image: "/categories/granola.png" } });
  const keto = await prisma.category.create({ data: { name: "KETO", slug: "keto", image: "/categories/keto-special.png" } });
  const chocoMuesli = await prisma.category.create({ data: { name: "Chocolate Muesli", slug: "chocolate-muesli", parentId: muesli.id } });

  console.log("🏷️ Tworzenie produktów...");
  const productConfigs = [
    { name: "Choco-Almond Dream", slug: "choco-almond", price: 24.99, promoPrice: 19.99, statusId: sSale.id, cat: [muesli.id, chocoMuesli.id], ing: [0, 1] },
    { name: "Honey Nut Crunch", slug: "honey-nut", price: 29.99, promoPrice: null, statusId: sNew.id, cat: [granola.id], ing: [2, 1, 4] },
    { name: "Keto Berry Blast", slug: "keto-berry", price: 34.99, promoPrice: 28.50, statusId: sHot.id, cat: [keto.id], ing: [3, 4, 5] },
    { name: "Tropical Coconut", slug: "tropical-coconut", price: 27.50, promoPrice: null, statusId: null, cat: [granola.id], ing: [5, 2] },
    { name: "Double Dark Choco", slug: "double-dark", price: 31.00, promoPrice: 25.00, statusId: sSale.id, cat: [granola.id, chocoMuesli.id], ing: [0, 6] },
  ];

  for (const p of productConfigs) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: `Wyjątkowy produkt ${p.name} stworzony dla Twojego zdrowia.`,
        price: p.price,
        promoPrice: p.promoPrice,
        statusId: p.statusId,
        weight: "500g",
        stock: Math.floor(Math.random() * 50) + 10,
        categories: { connect: p.cat.map(id => ({ id })) },
        ingredients: { connect: p.ing.map(idx => ({ id: ingredients[idx].id })) },
        images: { create: [{ url: "/product/main.png" }] }
      }
    });

    await prisma.review.create({
      data: {
        content: `Świetna tekstura i smak. Mój ulubiony to ${p.name}.`,
        rating: 5,
        userId: testUser.id,
        productId: product.id,
      }
    });
  }

  console.log("✅ Baza danych została pomyślnie zasilona!");
}

main()
  .catch((e) => {
    console.error("❌ Błąd podczas seedowania:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });