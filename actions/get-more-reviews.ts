"use server";

import { db } from "@/lib/db";

export async function getMoreReviews(productId: string, skip: number, take: number = 9) {
  try {
    const reviews = await db.review.findMany({
      where: { productId },
      skip: skip, // Omijamy te, które już mamy
      take: take, // bierzemy nową paczkę
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    
    return reviews;
  } catch (error) {
    console.error("Error fetching more reviews:", error);
    return [];
  }
}