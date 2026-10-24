// lib/db-reviews.ts
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { toPlainDeep } from "@/lib/serialize";
import { reportError } from "@/lib/logger";

export interface VoiceQuery {
  take?: number;
  rating?: number;
  search?: string;
}

/**
 * Opinie dla panelu moderacji, wraz z licznikiem pasującym do filtrów.
 *
 * Wcześniej ta sama treść żyła w Server Action wołanej z `useEffect`, więc
 * była wystawiona jako endpoint POST mimo że jest zwykłym odczytem, a strona
 * renderowała się dwa razy: raz pusta, raz z danymi.
 */
export async function getVoices({ take = 10, rating, search }: VoiceQuery) {
  await requireAdmin();

  const where = {
    ...(rating ? { rating } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            {
              product: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [reviews, totalCount] = await Promise.all([
      db.review.findMany({
        where,
        take,
        include: {
          user: { select: { name: true, image: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.review.count({ where }),
    ]);

    return { reviews: toPlainDeep(reviews), totalCount };
  } catch (error) {
    reportError(error, { area: "db.reviews" });
    return { reviews: [], totalCount: 0 };
  }
}
