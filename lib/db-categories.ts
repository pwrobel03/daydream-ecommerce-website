// lib/db-categories.ts
import { db } from "@/lib/db";

// Bez łapania błędów — patrz komentarz w lib/db-products.ts. Pusta lista tutaj
// znaczy "nie ma kategorii", a nie "baza nie odpowiada".

export const getMainCategories = async () => {
  return db.category.findMany({
    where: {
      parentId: null, // Pobieramy tylko główne kategorie
    },
    orderBy: {
      name: "asc",
    },
    // Opcjonalnie: możemy od razu policzyć ile produktów jest w każdej kategorii
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
};

export const getCategoryBySlug = async (slug: string) => {
  return db.category.findUnique({
    where: { slug },
    include: {
      children: true, // Pobieramy podkategorie (np. dla filtrów bocznych)
      products: {
        include: {
          images: true,
          ingredients: true,
        },
      },
    },
  });
};
