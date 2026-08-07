"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";


export async function getVoices({
  take = 10,
  skip = 0,
  rating,
  search,
}: {
  take?: number;
  skip?: number;
  rating?: number;
  search?: string;
}) {
  try {
    await requireAdmin(); // Bezpieczeństwo przede wszystkim

    const where = {
      ...(rating ? { rating } : {}),
      ...(search ? {
        OR: [
          { content: { contains: search, mode: 'insensitive' as const } },
          { product: { name: { contains: search, mode: 'insensitive' as const } } }
        ]
      } : {})
    };

    const reviews = await db.review.findMany({
      where,
      take,
      skip,
      include: {
        user: { select: { name: true, image: true } },
        product: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalCount = await db.review.count({ where });

    return { reviews, totalCount };
  } catch (error) {
    console.error("Fetch error:", error);
    return { reviews: [], totalCount: 0 };
  }
}

export async function deleteVoice(id: string) {
  try {
    await requireAdmin(); // Kluczowe zabezpieczenie

    await db.review.delete({ where: { id } });
    revalidatePath("/dashboard/comments");
    return { success: "Voice removed." };
  } catch (error) {
    return { error: "Action forbidden." };
  }
}