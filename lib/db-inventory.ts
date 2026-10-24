// lib/db-inventory.ts
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { toPlainDeep } from "@/lib/serialize";
import { reportError } from "@/lib/logger";

export interface InventoryQuery {
  take?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  /** "low" (≤5 i >0) albo "empty"; cokolwiek innego znaczy brak filtra. */
  stockStatus?: string;
}

/**
 * Produkty dla panelu asortymentu, wraz z licznikiem pasującym do filtrów.
 *
 * Ręczne `Number(p.price)` z poprzedniej wersji jest zbędne — rozszerzenie
 * klienta Prismy zamienia `Decimal` na `number` już przy odczycie.
 */
export async function getInventoryProducts({
  take = 5,
  search = "",
  categoryId,
  subCategoryId,
  stockStatus,
}: InventoryQuery) {
  await requireAdmin();

  const where = {
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),

    // Wybór podkategorii zawęża dokładnie do niej; sama kategoria obejmuje
    // też wszystkie swoje dzieci.
    ...(subCategoryId
      ? { categories: { some: { id: subCategoryId } } }
      : categoryId
        ? {
            categories: {
              some: { OR: [{ id: categoryId }, { parentId: categoryId }] },
            },
          }
        : {}),

    ...(stockStatus === "low" ? { stock: { lte: 5, gt: 0 } } : {}),
    ...(stockStatus === "empty" ? { stock: 0 } : {}),
  };

  try {
    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        take,
        include: {
          categories: { include: { parent: true } },
          status: true,
          images: { take: 1, select: { url: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where }),
    ]);

    return { products: toPlainDeep(products), totalCount };
  } catch (error) {
    reportError(error, { area: "db.inventory" });
    return { products: [], totalCount: 0 };
  }
}
