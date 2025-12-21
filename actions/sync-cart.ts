"use server";
import { db } from "@/lib/db";

export async function getFreshCartData(productIds: string[]) {
  try {
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        price: true,
        promoPrice: true,
        stock: true,
        name: true,
        // pobierz status, żeby wiedzieć czy produkt nie został np. wyłączony
      }
    });
    // simple return result in error data cause of prisma decimal 
    return products.map(product => ({
      ...product,
      price: Number(product.price),
      promoPrice: product.promoPrice ? Number(product.promoPrice) : null,
      stock: Number(product.stock)
    }));
  } catch (error) {
    console.error("Cart sync error:", error);
    return [];
  }
}