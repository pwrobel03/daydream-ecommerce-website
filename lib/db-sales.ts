// lib/db-sales.ts
import { db } from "@/lib/db";

/**
 * Promocje na baner strony startowej.
 *
 * Bez `catch`: pusta lista ma znaczyć "nie ma promocji", a nie "baza nie
 * odpowiada" — tak samo jak w pozostałych zapytaniach katalogu.
 */
export const getAllSales = async () => {
  return db.sale.findMany({ orderBy: { name: "asc" } });
};
