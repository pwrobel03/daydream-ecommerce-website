"use server";
import { db } from "@/lib/db";
import { reportError } from "@/lib/logger";

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
    // Jawne pola zamiast spreadu: spread kopiuje też własności symboliczne
    // wyniku Prismy, których granica serwer/klient nie przepuszcza.
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      promoPrice: product.promoPrice,
      stock: product.stock,
    }));
  } catch (error) {
    reportError(error, { area: "store.syncCart" });
    return [];
  }
}