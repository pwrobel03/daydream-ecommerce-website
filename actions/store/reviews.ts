"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReviewSchema } from "@/schemas";
import { Review } from "@/types/product";

export type CreateReviewResponse = {
  success?: string;
  error?: string;
  review?: Review;
};


export async function getMoreReviews(
  productId: string, 
  skip: number, 
  take: number = 9,
  currentUserId?: string // Dodajemy świadomość usera
) {
  try {
    const reviews = await db.review.findMany({
      where: { 
        productId,
        // Zawsze wykluczamy recenzję zalogowanego usera z "ogólnego strumienia"
        NOT: currentUserId ? { userId: currentUserId } : undefined
      },
      skip: skip,
      take: take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, image: true } } }
    });
    
    return reviews;
  } catch (error) {
    console.error("Error fetching more reviews:", error);
    return [];
  }
}

export async function createReview(
  values: z.infer<typeof ReviewSchema>
): Promise<CreateReviewResponse> {
  const validatedFields = ReviewSchema.safeParse(values);

  if (!validatedFields.success) return { error: "Invalid fields!" };

  const { productId, userId, rating, content } = validatedFields.data;

  try {
    const existingReview = await db.review.findFirst({
      where: { productId, userId },
    });

    if (existingReview) return { error: "You already shared your story!" };

    // KLUCZ: Tworzymy i od razu pobieramy z relacją user
    const newReview = await db.review.create({
      data: { productId, userId, rating, content },
      include: {
        user: {
          select: { name: true, image: true }
        }
      }
    });

    revalidatePath(`/product/[slug]`, "page");

    // Zwracamy czysty obiekt JSON z PRAWDZIWYM ID z bazy
    return { 
      success: "Story shared!", 
      review: JSON.parse(JSON.stringify(newReview)) as Review 
    };
  } catch (error) {
    return { error: "Failed to save review." };
  }
}

// UPDATE REVIEW
export async function updateReview(
  reviewId: string, 
  values: { rating: number, content: string }, 
  slug: string
): Promise<CreateReviewResponse> { // Upewnij się, że typ zwracany jest poprawny
  try {
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        rating: values.rating,
        content: values.content,
      },
      // KLUCZOWE: Musisz dołączyć usera, inaczej TS zgłosi błąd braku właściwości 'user'
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        }
      }
    });

    revalidatePath(`/product/${slug}`);

    // Teraz updatedReview zawiera pole 'user', więc pasuje do ReviewType
    return { 
      success: "Your story has been updated!", 
      review: JSON.parse(JSON.stringify(updatedReview)) 
    };
  } catch (error) {
    console.error("UPDATE_REVIEW_ERROR", error);
    return { error: "Failed to update review." };
  }
}

// DELETE REVIEW
export async function deleteReview(reviewId: string, slug: string): Promise<CreateReviewResponse> {
  try {
    await db.review.delete({ where: { id: reviewId } });
    revalidatePath(`/product/${slug}`);
    return { success: "Twój głos został usunięty." };
  } catch (error) {
    return { error: "Nie udało się usunąć opinii." };
  }
}