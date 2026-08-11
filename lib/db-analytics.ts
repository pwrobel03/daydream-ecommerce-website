// lib/db-analytics.ts
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

// Bez łapania błędów, jak reszta warstwy danych: awaria bazy ma dać stronę
// błędu, a nie panel pokazujący same zera — te są nie do odróżnienia od
// prawdziwego braku sprzedaży.

export interface RevenuePoint {
  /** Dzień w formacie ISO (YYYY-MM-DD), w strefie serwera. */
  day: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  revenue: number;
}

export interface AnalyticsSummary {
  revenue: number;
  paidOrders: number;
  /** Średnia wartość opłaconego zamówienia; 0 przy braku zamówień. */
  averageOrderValue: number;
  /** Udział zamówień opłaconych we wszystkich założonych w okresie. */
  conversionRate: number;
  abandonedOrders: number;
}

/**
 * Przychód dzień po dniu, z dniami bez sprzedaży włącznie.
 *
 * `generate_series` po stronie bazy, a nie uzupełnianie luk w JavaScripcie:
 * inaczej wykres milcząco zwężałby oś tam, gdzie nikt nie kupił, i 30 dni
 * z dwoma transakcjami wyglądałoby jak dwa dni ciągłej sprzedaży.
 */
export async function getRevenueByDay(days: number): Promise<RevenuePoint[]> {
  await requireAdmin();

  const rows = await db.$queryRaw<
    { day: Date; revenue: number | null; orders: bigint }[]
  >`
    SELECT
      series.day::date AS day,
      SUM(o."totalAmount")::float8 AS revenue,
      COUNT(o.id) AS orders
    FROM generate_series(
      date_trunc('day', NOW()) - MAKE_INTERVAL(days => ${days - 1}),
      date_trunc('day', NOW()),
      '1 day'
    ) AS series(day)
    LEFT JOIN "Order" o
      ON date_trunc('day', o."createdAt") = series.day
     AND o."isPaid" = true
    GROUP BY series.day
    ORDER BY series.day
  `;

  return rows.map((row) => ({
    day: row.day.toISOString().slice(0, 10),
    revenue: row.revenue ?? 0,
    orders: Number(row.orders),
  }));
}

/**
 * Produkty o największym przychodzie w okresie.
 *
 * Liczone z `OrderItem.price`, czyli ceny zapisanej w chwili zakupu — bieżąca
 * cena produktu mogła się od tamtej pory zmienić, a raport ma pokazywać, ile
 * faktycznie wpłynęło.
 */
export async function getTopProducts(
  days: number,
  limit = 5
): Promise<TopProduct[]> {
  await requireAdmin();

  return db.$queryRaw<TopProduct[]>`
    SELECT
      p.id           AS "productId",
      p.name         AS name,
      p.slug         AS slug,
      SUM(i.quantity)::int             AS quantity,
      SUM(i.price * i.quantity)::float8 AS revenue
    FROM "OrderItem" i
    JOIN "Order" o   ON o.id = i."orderId"
    JOIN "Product" p ON p.id = i."productId"
    WHERE o."isPaid" = true
      AND o."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
    GROUP BY p.id, p.name, p.slug
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
}

/** Zbiorcze liczby dla nagłówka panelu. */
export async function getAnalyticsSummary(
  days: number
): Promise<AnalyticsSummary> {
  await requireAdmin();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [paid, created] = await Promise.all([
    db.order.aggregate({
      where: { isPaid: true, createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.order.count({ where: { createdAt: { gte: since } } }),
  ]);

  // Jawna konwersja, mimo że typ mówi `number`. Rozszerzenie klienta z
  // lib/db.ts konwertuje pola *wyniku*, a `_sum` jest agregatem — Prisma zwraca
  // tu `Decimal`, więc bez tego typ kłamałby o runtime dokładnie tak, jak
  // przed wprowadzeniem rozszerzenia. Test integracyjny pilnuje tego wprost.
  const revenue = Number(paid._sum.totalAmount ?? 0);
  const paidOrders = paid._count;

  return {
    revenue,
    paidOrders,
    averageOrderValue: paidOrders > 0 ? revenue / paidOrders : 0,
    // Zamówienie powstaje dopiero przy przejściu do płatności, więc to
    // konwersja checkoutu, nie odwiedzin — nazwa w interfejsie mówi wprost.
    conversionRate: created > 0 ? paidOrders / created : 0,
    abandonedOrders: created - paidOrders,
  };
}
