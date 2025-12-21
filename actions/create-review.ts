"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReviewSchema } from "@/schemas";
import { ReviewType } from "@/types/product";

export type CreateReviewResponse = {
  success?: string;
  error?: string;
  review?: ReviewType;
};

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
      review: JSON.parse(JSON.stringify(newReview)) as ReviewType 
    };
  } catch (error) {
    return { error: "Failed to save review." };
  }
}