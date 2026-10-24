// lib/db-orders.ts
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { toPlainDeep } from "@/lib/serialize";

/**
 * Zamówienia dla panelu, ze stronicowaniem i globalnym szukaniem.
 *
 * Było Server Action wołaną z Server Componentu, czyli odczytem wystawionym
 * jako endpoint POST — tak samo jak `getVoices` i `getInventoryProducts`,
 * zanim trafiły tutaj. Bez `catch`: awaria bazy ma dać stronę błędu, a nie
 * terminal pokazujący "Active Records: 0" ze statusem 200.
 */
export const getAdminOrders = async (
  page: number = 1,
  pageSize: number = 15,
  search?: string
) => {
  await requireAdmin();

  const skip = (page - 1) * pageSize;

  // Przeszukuje po identyfikatorze zamówienia, danych kupującego i adresie.
  const where = search
    ? {
        OR: [
          { id: { contains: search, mode: "insensitive" as const } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { address: { street: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [orders, totalCount] = await Promise.all([
    db.order.findMany({
      where,
      take: pageSize,
      skip,
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.order.count({ where }),
  ]);

  // Wiersze idą do komponentu klienckiego, więc muszą być zwykłymi obiektami.
  // Poprzednia wersja miała komentarz obiecujący tę konwersję i nie robiła jej.
  return {
    orders: toPlainDeep(orders),
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
  };
};
