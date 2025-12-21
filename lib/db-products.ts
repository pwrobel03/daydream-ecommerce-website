// lib/db-products.ts
import { db } from "@/lib/db";

export const getCategoryWithProducts = async (slug: string) => {
  try {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            images: true,
            ingredients: true,
            status: true,
            reviews: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
        },
      },
    });

    if (!category) return null;
    return JSON.parse(JSON.stringify(category));
    
  } catch (error) {
    console.error("Error fetching category products:", error);
    return null;
  }
};

export const getProductBySlug = async (slug: string, currentUserId?: string) => {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        images: true,
        ingredients: true,
        status: true,
        // Pobieramy informację o całkowitej liczbie recenzji
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!product) return null;

    // Pobieramy opinię zalogowanego użytkownika (jeśli podano ID)
    const userReview = currentUserId 
      ? await db.review.findFirst({
          where: { productId: product.id, userId: currentUserId },
          include: { user: { select: { name: true, image: true } } }
        })
      : null;

    // Pobieramy 9 pozostałych opinii (wykluczając tę od userReview)
    const otherReviews = await db.review.findMany({
      where: { 
        productId: product.id,
        // KLUCZ: Wykluczamy opinię użytkownika, jeśli ją znaleźliśmy
        NOT: userReview ? { id: userReview.id } : undefined 
      },
      take: 9,
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { name: true, image: true } } 
      }
    });

    // Składamy to w jeden obiekt dla frontendu
    const result = {
      ...product,
      userReview, // Twoja opinia (osobno)
      reviews: otherReviews, // Pozostałe 9 (osobno)
    };

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Error in getProductBySlug:", error);
    return null;
  }
};