"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReviewSchema } from "@/schemas";


export async function createReview(values: z.infer<typeof ReviewSchema>) {
  const validatedFields = ReviewSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { productId, userId, rating, content } = validatedFields.data;

  try {
    // every user can add only one review for each product
    const existingReview = await db.review.findFirst({
      where: {
        productId: values.productId,
        userId: values.userId,
      },
    });
    if (existingReview) {
      return { error: "You already share your story!" };
    }

    await db.review.create({
      data: {
        productId,
        userId,
        rating,
        content,
      },
    });

    revalidatePath(`/product/[slug]`, "page");
    return { success: "Thanks for sharing your story! Now other users can see it" };
  } catch (error) {
    return { error: "Something went wrong! Try again later." };
  }
}