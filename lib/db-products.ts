// lib/db-products.ts
import { db } from "@/lib/db";
import { toPlainDeep } from "@/lib/dto";

// Te funkcje celowo nie łapią błędów. `null` znaczy "nie ma takiego rekordu"
// i wywołujący zamienia to na notFound(); awaria bazy leci wyżej, do error.tsx,
// więc kończy się stroną błędu i statusem 5xx. Wcześniej oba przypadki
// wyglądały tak samo — niedostępna baza renderowała pusty katalog z HTTP 200,
// więc monitoring nie miał czego zauważyć.

export interface RatingSummary {
  ratingAvg: number;
  ratingCount: number;
}

/**
 * Średnia ocena i liczba opinii, policzone przez bazę.
 *
 * Wcześniej liczył je interfejs z tych opinii, które akurat pobrano — a karta
 * katalogu dostawała wszystkie opinie każdego produktu tylko po to, żeby
 * wyliczyć jedną liczbę. Jedno `groupBy` na całą siatkę zastępuje to zarówno
 * w wyniku, jak i w ilości przewożonych danych.
 */
async function ratingsFor(
  productIds: string[]
): Promise<Map<string, RatingSummary>> {
  if (productIds.length === 0) return new Map();

  const grouped = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((row) => [
      row.productId,
      {
        ratingAvg: row._avg.rating ?? 0,
        ratingCount: row._count._all,
      },
    ])
  );
}

/** Dokleja podsumowanie ocen; produkt bez opinii dostaje zera, nie `undefined`. */
function withRatings<T extends { id: string }>(
  products: T[],
  ratings: Map<string, RatingSummary>
): (T & RatingSummary)[] {
  return products.map((product) => ({
    ...product,
    ...(ratings.get(product.id) ?? { ratingAvg: 0, ratingCount: 0 }),
  }));
}

/**
 * Pobiera konkretną kategorię wraz z limitowaną liczbą produktów
 */
export const getCategoryWithProducts = async (
  slug: string,
  limit: number = 25
) => {
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      products: {
        take: limit, // KLUCZOWE DLA LOAD MORE
        orderBy: { createdAt: "desc" },
        include: {
          images: true,
          ingredients: true,
          status: true,
          categories: true, // Dla tagów na karcie
        },
      },
    },
  });

  if (!category) return null;

  const ratings = await ratingsFor(category.products.map((p) => p.id));

  return toPlainDeep({
    ...category,
    products: withRatings(category.products, ratings),
  });
};

/**
 * Pobiera wszystkie produkty (widok /category/all) z limitem
 */
export const getAllProductsAsCategory = async (limit: number = 25) => {
  const products = await db.product.findMany({
    take: limit, // KLUCZOWE DLA LOAD MORE
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      ingredients: true,
      status: true,
      categories: true,
    },
  });

  const ratings = await ratingsFor(products.map((p) => p.id));

  return {
    id: "all-products-virtual-id",
    name: "All Artifacts",
    slug: "all",
    description: "A complete collection of every dream captured so far.",
    products: toPlainDeep(withRatings(products, ratings)),
  };
};

/**
 * Pomocnicza funkcja do licznika - sprawdza ile produktów jest łącznie w bazie/kategorii
 * Potrzebna, aby przycisk "Load More" wiedział, kiedy zniknąć.
 */
export const getTotalProductsCount = async (slug?: string) => {
  if (slug && slug !== "all") {
    const category = await db.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    return category?._count.products ?? 0;
  }

  return db.product.count();
};

// Funkcja getProductBySlug zostaje bez zmian (jak w poprzedniej wiadomości)

export const getProductBySlug = async (
  slug: string,
  currentUserId?: string
) => {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: true,
      ingredients: true,
      status: true,
      categories: true, // DODANE: Aby wiedzieć, do jakiej kategorii należy produkt
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return null;

  const userReview = currentUserId
    ? await db.review.findFirst({
        where: { productId: product.id, userId: currentUserId },
        include: { user: { select: { name: true, image: true } } },
      })
    : null;

  const otherReviews = await db.review.findMany({
    where: {
      productId: product.id,
      NOT: userReview ? { id: userReview.id } : undefined,
    },
    take: 9,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, image: true } } },
  });

  // Agregat obejmuje wszystkie opinie, także tę należącą do wywołującego —
  // inaczej ocena widoczna na stronie zmieniałaby się w zależności od tego,
  // kto jest zalogowany, i to samo trafiałoby do danych strukturalnych.
  const [rating] = [...(await ratingsFor([product.id])).values()];

  const result = {
    ...product,
    ...(rating ?? { ratingAvg: 0, ratingCount: 0 }),
    userReview,
    reviews: otherReviews,
  };

  return toPlainDeep(result);
};
