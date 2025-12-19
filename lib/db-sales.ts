// lib/db-sales.ts
import { db } from "@/lib/db"; // Twoja instancja PrismaClient

export const getActiveSaleByCouponCode = async (couponCode: string) => {
  try {
    const activeSale = await db.sale.findFirst({
      where: {
        couponCode: couponCode,
        isActive: true,
        // Sprawdzenie, czy kupon nie wygasł
        validTo: {
          gte: new Date(), // "greater than or equal" - data końcowa musi być w przyszłości
        },
      },
    });
    return activeSale;
  } catch (error) {
    console.error("Błąd podczas sprawdzania kuponu:", error);
    return null;
  }
};

export const getAllSales = async () => {
  try {
    return await db.sale.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};