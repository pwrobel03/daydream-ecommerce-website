"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { reportError } from "@/lib/logger";
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result";


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
    reportError(error, { area: "admin.reviews" });
    return { reviews: [], totalCount: 0 };
  }
}

export async function deleteVoice(id: string): Promise<ActionResult> {
  try {
    await requireAdmin(); // Kluczowe zabezpieczenie

    await db.review.delete({ where: { id } });
    revalidatePath("/dashboard/comments");
    return ok();
  } catch (error) {
    // Wcześniej każda awaria — także błąd bazy — wracała jako "Action
    // forbidden.", więc log i komunikat mówiły co innego niż rzeczywistość.
    reportError(error, { area: "admin.reviews", id });
    return failFrom(error, "INTERNAL", "Failed to remove the voice.");
  }
}