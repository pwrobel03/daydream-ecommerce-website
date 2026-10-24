"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReviewSchema } from "@/schemas";
import { Review } from "@/types/product";
import { reportError } from "@/lib/logger";
import { ActionResult, fail, ok } from "@/lib/action-result";
import { toPlainDeep } from "@/lib/serialize";
import { getSession } from "@/lib/session";


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
    reportError(error, { area: "store.reviews" });
    return [];
  }
}

export async function createReview(
  values: z.infer<typeof ReviewSchema>
): Promise<ActionResult<{ review: Review }>> {
  // Autor bierze się z sesji, nie z formularza. Wcześniej `userId` przychodził
  // w payloadzie, więc dowolny zalogowany użytkownik mógł wystawić opinię
  // podpisaną cudzym kontem.
  const session = await getSession();
  if (!session?.user?.id) return fail("UNAUTHORIZED", "You must be signed in.");
  const userId = session.user.id;

  const validatedFields = ReviewSchema.safeParse(values);
  if (!validatedFields.success) return fail("INVALID_INPUT", "Invalid fields!");

  const { productId, rating, content } = validatedFields.data;

  try {
    const existingReview = await db.review.findFirst({
      where: { productId, userId },
    });

    if (existingReview) return fail("CONFLICT", "You already shared your story!");

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

    return ok({ review: toPlainDeep(newReview) });
  } catch (error) {
    reportError(error, { area: "store.reviews", productId });
    return fail("INTERNAL", "Failed to save review.");
  }
}

// UPDATE REVIEW
export async function updateReview(
  reviewId: string,
  values: { rating: number; content: string },
  slug: string
): Promise<ActionResult<{ review: Review }>> {
  const session = await getSession();
  if (!session?.user?.id) return fail("UNAUTHORIZED", "You must be signed in.");

  try {
    // `userId` w predykacie, nie samo `id` — bez niego wystarczyło znać cudze
    // id opinii, żeby ją nadpisać.
    const updatedReview = await db.review.update({
      where: { id: reviewId, userId: session.user.id },
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

    return ok({ review: toPlainDeep(updatedReview) });
  } catch (error) {
    reportError(error, { area: "store.reviews", reviewId });
    return fail("NOT_FOUND", "Failed to update review.");
  }
}

// DELETE REVIEW
export async function deleteReview(
  reviewId: string,
  slug: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) return fail("UNAUTHORIZED", "You must be signed in.");

  try {
    // Ten sam brakujący predykat co w updateReview.
    await db.review.delete({ where: { id: reviewId, userId: session.user.id } });
    revalidatePath(`/product/${slug}`);
    return ok();
  } catch (error) {
    reportError(error, { area: "store.reviews", reviewId });
    return fail("NOT_FOUND", "Failed to delete review.");
  }
}