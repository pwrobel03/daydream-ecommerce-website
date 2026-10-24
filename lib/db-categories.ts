// lib/db-categories.ts
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// Bez łapania błędów — patrz komentarz w lib/db-products.ts. Pusta lista tutaj
// znaczy "nie ma kategorii", a nie "baza nie odpowiada".

const categoryCardSelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
  description: true,
} satisfies Prisma.CategorySelect;

export const getMainCategories = async () => {
  return db.category.findMany({
    where: {
      parentId: null, // Pobieramy tylko główne kategorie
    },
    orderBy: {
      name: "asc",
    },
    select: categoryCardSelect,
  });
};

export const getCategoryBySlug = async (slug: string) => {
  return db.category.findUnique({
    where: { slug },
    select: {
      ...categoryCardSelect,
      children: { select: categoryCardSelect }, // Podkategorie (np. dla filtrów bocznych)
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { select: { id: true, url: true } },
          ingredients: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
};

export type CategoryCard = Awaited<ReturnType<typeof getMainCategories>>[number];
export type CategoryWithChildren = NonNullable<
  Awaited<ReturnType<typeof getCategoryBySlug>>
>;
