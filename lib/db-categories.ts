// lib/db-categories.ts
import { db } from "@/lib/db";

export const getMainCategories = async () => {
  try {
    const categories = await db.category.findMany({
      where: {
        parentId: null, // Pobieramy tylko główne kategorie
      },
      orderBy: {
        name: 'asc',
      },
      // Opcjonalnie: możemy od razu policzyć ile produktów jest w każdej kategorii
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    return categories;
  } catch (error) {
    console.error("Error fetching main categories:", error);
    return [];
  }
};

export const getCategoryBySlug = async (slug: string) => {
  try {
    return await db.category.findUnique({
      where: { slug },
      include: {
        children: true, // Pobieramy podkategorie (np. dla filtrów bocznych)
        products: {
          include: {
            images: true,
            ingredients: true
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }
};