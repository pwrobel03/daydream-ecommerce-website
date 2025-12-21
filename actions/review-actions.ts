"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateReviewResponse } from "./create-review";

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