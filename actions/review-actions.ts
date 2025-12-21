"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// DELETE REVIEW
export async function deleteReview(reviewId: string, slug: string) {
  try {
    await db.review.delete({ where: { id: reviewId } });
    revalidatePath(`/product/${slug}`);
    return { success: "Twój głos został usunięty." };
  } catch (error) {
    return { error: "Nie udało się usunąć opinii." };
  }
}

// UPDATE REVIEW
export async function updateReview(reviewId: string, values: { rating: number, content: string }, slug: string) {
  try {
    await db.review.update({
      where: { id: reviewId },
      data: { ...values }
    });
    revalidatePath(`/product/${slug}`);
    return { success: "Twój głos został zaktualizowany." };
  } catch (error) {
    return { error: "Nie udało się zaktualizować opinii." };
  }
}