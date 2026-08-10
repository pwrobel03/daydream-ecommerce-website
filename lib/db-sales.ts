// lib/db-sales.ts
import { db } from "@/lib/db"; // Twoja instancja PrismaClient
import { reportError } from "@/lib/logger";

export const getAllSales = async () => {
  try {
    return await db.sale.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    reportError(error, { area: "db.sales" });
    return [];
  }
};