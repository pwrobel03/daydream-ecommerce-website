"use server";

import { db } from "@/lib/db";

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