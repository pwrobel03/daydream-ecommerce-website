import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "./reset";

// Własne id admina na plik: suity dzielą jedną bazę, więc wspólne "admin"
// wywracało `beforeAll` tej, która trafiła na drugą pozycję — a vitest
// raportował to jako "skipped", co w podsumowaniu wygląda jak sukces.
const ADMIN_ID = "admin-analytics";

const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "admin-analytics", role: "ADMIN" as const } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

const { getRevenueByDay, getTopProducts, getAnalyticsSummary } = await import(
  "@/lib/db-analytics"
);

const DAY = 24 * 60 * 60 * 1000;

let productA: string;
let productB: string;

async function order({
  paid,
  total,
  daysAgo,
  items,
}: {
  paid: boolean;
  total: number;
  daysAgo: number;
  items: { productId: string; quantity: number; price: number }[];
}) {
  const createdAt = new Date(Date.now() - daysAgo * DAY);

  return db.order.create({
    data: {
      userId: ADMIN_ID,
      totalAmount: total,
      isPaid: paid,
      status: paid ? "PAID" : "PENDING",
      createdAt,
      items: { create: items },
    },
  });
}

beforeAll(async () => {
  await db.user.create({
    data: { id: ADMIN_ID, email: "analytics@example.com", role: "ADMIN" },
  });
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(db);

  const [a, b] = await Promise.all([
    db.product.create({
      data: { name: "Alpha", slug: `alpha-${Date.now()}`, price: 10, stock: 50 },
    }),
    db.product.create({
      data: { name: "Beta", slug: `beta-${Date.now()}`, price: 20, stock: 50 },
    }),
  ]);
  productA = a.id;
  productB = b.id;
});

describe("getAnalyticsSummary", () => {
  it("returns plain numbers, not Decimal, for the money it sums", async () => {
    // Rozszerzenie klienta Prismy konwertuje pola wyniku, ale `_sum` jest
    // agregatem — typ mówi `number`, więc gdyby runtime dawał `Decimal`,
    // typ kłamałby dokładnie tak, jak przed wprowadzeniem rozszerzenia.
    await order({ paid: true, total: 30, daysAgo: 1, items: [] });

    const summary = await getAnalyticsSummary(30);

    expect(typeof summary.revenue).toBe("number");
    expect(summary.revenue).toBe(30);
  });

  it("counts only paid orders as revenue and reports checkout conversion", async () => {
    await order({ paid: true, total: 100, daysAgo: 1, items: [] });
    await order({ paid: true, total: 50, daysAgo: 2, items: [] });
    await order({ paid: false, total: 70, daysAgo: 2, items: [] });

    const summary = await getAnalyticsSummary(30);

    expect(summary.revenue).toBe(150);
    expect(summary.paidOrders).toBe(2);
    expect(summary.averageOrderValue).toBe(75);
    expect(summary.abandonedOrders).toBe(1);
    expect(summary.conversionRate).toBeCloseTo(2 / 3, 5);
  });

  it("ignores anything older than the window", async () => {
    await order({ paid: true, total: 999, daysAgo: 40, items: [] });

    const summary = await getAnalyticsSummary(30);

    expect(summary.revenue).toBe(0);
    expect(summary.averageOrderValue).toBe(0);
    expect(summary.conversionRate).toBe(0);
  });
});

describe("the report window", () => {
  it("makes the summary total equal the sum of the chart bars", async () => {
    // Zamówienie sprzed 29 dni i 20 godzin: mieści się w kroczącym oknie
    // 30 × 24 h, ale kalendarzowo wypada 30 dni wstecz. Póki karty liczyły
    // krocząco, a wykres kalendarzowo, ten sam ekran pokazywał 100 w nagłówku
    // i 0 na słupkach.
    await order({ paid: true, total: 100, daysAgo: 29 + 20 / 24, items: [] });
    await order({ paid: true, total: 40, daysAgo: 1, items: [] });

    const summary = await getAnalyticsSummary(30);
    const chart = await getRevenueByDay(30);

    expect(chart.reduce((sum, point) => sum + point.revenue, 0)).toBe(
      summary.revenue
    );
  });

  it("uses the same window for top products", async () => {
    await order({
      paid: true,
      total: 100,
      daysAgo: 29 + 20 / 24,
      items: [{ productId: productA, quantity: 1, price: 100 }],
    });

    const [summary, top] = await Promise.all([
      getAnalyticsSummary(30),
      getTopProducts(30),
    ]);

    expect(top.reduce((sum, p) => sum + p.revenue, 0)).toBe(summary.revenue);
  });
});

describe("getRevenueByDay", () => {
  it("returns one point per day, including days with no sales", async () => {
    // Bez `generate_series` dni bez sprzedaży w ogóle by nie wróciły, a wykres
    // ściskałby oś tak, że dwie transakcje w miesiącu wyglądałyby jak dwa dni
    // ciągłej sprzedaży.
    await order({ paid: true, total: 40, daysAgo: 1, items: [] });

    const points = await getRevenueByDay(7);

    expect(points).toHaveLength(7);
    expect(points.filter((p) => p.revenue === 0)).toHaveLength(6);
    expect(points.at(-2)?.revenue).toBe(40);
    expect(points.every((p) => typeof p.revenue === "number")).toBe(true);
  });

  it("leaves unpaid orders out of the daily figures", async () => {
    await order({ paid: false, total: 500, daysAgo: 1, items: [] });

    const points = await getRevenueByDay(7);

    expect(points.every((p) => p.revenue === 0)).toBe(true);
  });
});

describe("getTopProducts", () => {
  it("ranks by revenue using the price captured at purchase time", async () => {
    // Cena produktu mogła się od zakupu zmienić; raport ma pokazywać, ile
    // faktycznie wpłynęło, więc liczy z OrderItem.price.
    await order({
      paid: true,
      total: 100,
      daysAgo: 1,
      items: [
        { productId: productA, quantity: 2, price: 5 },
        { productId: productB, quantity: 1, price: 90 },
      ],
    });

    await db.product.update({ where: { id: productA }, data: { price: 999 } });

    const top = await getTopProducts(30);

    expect(top.map((p) => p.name)).toEqual(["Beta", "Alpha"]);
    expect(top[0].revenue).toBe(90);
    expect(top[1].revenue).toBe(10);
    expect(top[1].quantity).toBe(2);
  });

  it("excludes items from orders that were never paid", async () => {
    await order({
      paid: false,
      total: 100,
      daysAgo: 1,
      items: [{ productId: productA, quantity: 3, price: 10 }],
    });

    expect(await getTopProducts(30)).toEqual([]);
  });
});
