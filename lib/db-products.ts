// lib/db-products.ts
import { db } from "@/lib/db";

export const getCategoryWithProducts = async (slug: string) => {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            images: true, // get all photos of products
            ingredients: true, // get all ingredients
          },
        },
        children: true, // get the category of the products
      },
    });

    return category;
  } catch (error) {
    console.error("Error fetching category products:", error);
    return null;
  }
};