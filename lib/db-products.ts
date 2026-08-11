// lib/db-products.ts
import { db } from "@/lib/db";
import { toPlainDeep } from "@/lib/dto";

// Te funkcje celowo nie łapią błędów. `null` znaczy "nie ma takiego rekordu"
// i wywołujący zamienia to na notFound(); awaria bazy leci wyżej, do error.tsx,
// więc kończy się stroną błędu i statusem 5xx. Wcześniej oba przypadki
// wyglądały tak samo — niedostępna baza renderowała pusty katalog z HTTP 200,
// więc monitoring nie miał czego zauważyć.

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
          reviews: {
            include: {
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });

  return category ? toPlainDeep(category) : null;
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
      reviews: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
    },
  });

  return {
    id: "all-products-virtual-id",
    name: "All Artifacts",
    slug: "all",
    description: "A complete collection of every dream captured so far.",
    products: toPlainDeep(products),
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

  const result = {
    ...product,
    userReview,
    reviews: otherReviews,
  };

  return toPlainDeep(result);
};
