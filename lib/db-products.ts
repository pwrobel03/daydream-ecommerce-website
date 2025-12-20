// lib/db-products.ts
import { db } from "@/lib/db";

export const getCategoryWithProducts = async (slug: string) => {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            images: true,
            ingredients: true,
            status: true,
            reviews: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
        },
      },
    });

    if (!category) return null;
    return JSON.parse(JSON.stringify(category));
    
  } catch (error) {
    console.error("Error fetching category products:", error);
    return null;
  }
};