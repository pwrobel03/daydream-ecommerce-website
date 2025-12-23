"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function getInventoryProducts({
  take = 5,
  skip = 0,
  search = "",
  categoryId,
  subCategoryId,
  stockStatus, // NOWOŚĆ: 'all' | 'low' | 'empty'
}: {
  take?: number;
  skip?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  stockStatus?: string;
}) {
  try {
    await checkAdmin();

    const where = {
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      
      // Filtrowanie po kategoriach (Many-to-Many)
      ...(subCategoryId 
        ? { categories: { some: { id: subCategoryId } } } 
        : categoryId 
        ? { categories: { some: { OR: [{ id: categoryId }, { parentId: categoryId }] } } } 
        : {}),

      // NOWOŚĆ: Filtrowanie po Stock
      ...(stockStatus === "low" ? { stock: { lte: 5, gt: 0 } } : {}),
      ...(stockStatus === "empty" ? { stock: 0 } : {}),
    };

    const rawProducts = await db.product.findMany({
      where,
      take,
      skip,
      include: {
        categories: { include: { parent: true } },
        status: true,
        images: { take: 1 }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalCount = await db.product.count({ where });

    const products = rawProducts.map(p => ({
      ...p,
      price: Number(p.price),
      promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
      images: p.images.map(img => ({ url: img.url }))
    }));

    return { products, totalCount };
  } catch (error) {
    console.error("INVENTORY_FETCH_ERROR:", error);
    return { products: [], totalCount: 0 };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkAdmin();
    
    await db.product.delete({ 
      where: { id } 
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Product removed from the dreamscape." };
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR:", error);
    return { error: "Failed to delete product." };
  }
}