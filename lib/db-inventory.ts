// lib/db-inventory.ts
import { db } from "@/lib/db";
import { requireBackOffice } from "@/lib/guards";
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
  await requireBackOffice();

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
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          promoPrice: true,
          stock: true,
          categories: { select: { id: true, name: true } },
          status: { select: { name: true, color: true } },
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

export type InventoryProduct = Awaited<
  ReturnType<typeof getInventoryProducts>
>["products"][number];

/** Główne kategorie z podkategoriami — filtry asortymentu i formularz produktu. */
export async function getMainCategoriesWithChildren() {
  await requireAdmin();
  return db.category.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      children: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export type MainCategoryWithChildren = Awaited<
  ReturnType<typeof getMainCategoriesWithChildren>
>[number];

/** Wszystkie kategorie z licznikiem produktów — lista w panelu kategorii. */
export async function getCategoryList() {
  await requireAdmin();
  return db.category.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      parentId: true,
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CategoryListItem = Awaited<
  ReturnType<typeof getCategoryList>
>[number];

export async function getIngredients() {
  await requireAdmin();
  return db.ingredient.findMany({
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });
}

export type IngredientOption = Awaited<
  ReturnType<typeof getIngredients>
>[number];

export async function getIngredient(id: string) {
  await requireAdmin();
  return db.ingredient.findUnique({
    where: { id },
    select: { id: true, name: true, image: true },
  });
}

export async function getStatuses() {
  await requireAdmin();
  return db.status.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export type StatusOption = Awaited<ReturnType<typeof getStatuses>>[number];

/** Produkt do edycji w formularzu — tylko pola, które formularz wypełnia. */
export async function getProductForm(id: string) {
  await requireAdmin();
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      promoPrice: true,
      weight: true,
      stock: true,
      status: { select: { id: true } },
      categories: { select: { id: true } },
      ingredients: { select: { id: true } },
      images: { select: { url: true } },
    },
  });
  return product && toPlainDeep(product);
}

export type ProductFormData = NonNullable<
  Awaited<ReturnType<typeof getProductForm>>
>;
