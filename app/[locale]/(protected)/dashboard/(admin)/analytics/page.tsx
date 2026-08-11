import { Suspense } from "react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { RowsSkeleton } from "@/components/skeletons";
import {
  getAnalyticsSummary,
  getRevenueByDay,
  getTopProducts,
} from "@/lib/db-analytics";
import { RevenueChart } from "../../_components/revenue-chart";

// Dozwolone okna raportu. Zamknięta lista, a nie dowolna liczba z adresu —
// inaczej `?days=100000` puszczałby w bazę skan całej tabeli zamówień.
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function parseRange(value?: string): Range {
  const parsed = Number(value);
  return (RANGES as readonly number[]).includes(parsed) ? (parsed as Range) : 30;
}

type SearchParams = Promise<{ days?: string }>;

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { days } = await searchParams;
  const range = parseRange(days);

  const t = await getTranslations("dashboard.analytics");
  const format = await getFormatter();

  const [summary, revenue, topProducts] = await Promise.all([
    getAnalyticsSummary(range),
    getRevenueByDay(range),
    getTopProducts(range),
  ]);

  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "USD" });

  const cards = [
    { label: t("revenue"), value: money(summary.revenue) },
    { label: t("paidOrders"), value: String(summary.paidOrders) },
    { label: t("averageOrder"), value: money(summary.averageOrderValue) },
    {
      label: t("conversion"),
      value: format.number(summary.conversionRate, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
      hint: t("conversionHint", { abandoned: summary.abandonedOrders }),
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-8 border-b pb-10">
        <div className="space-y-1">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 ml-1">
            {t("subtitle", { days: range })}
          </p>
        </div>

        <nav aria-label={t("rangeLabel")} className="flex gap-2">
          {RANGES.map((option) => (
            <Link
              key={option}
              href={`?days=${option}`}
              aria-current={option === range ? "page" : undefined}
              className={
                option === range
                  ? "px-6 py-3 rounded-full bg-primary text-primary-foreground font-black uppercase italic text-[10px] tracking-widest"
                  : "px-6 py-3 rounded-full border font-black uppercase italic text-[10px] tracking-widest hover:bg-primary/10 transition-colors"
              }
            >
              {t("rangeOption", { days: option })}
            </Link>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card/60 border rounded-[2rem] p-8 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
              {card.label}
            </p>
            <p className="text-4xl font-black tracking-tighter">{card.value}</p>
            {card.hint && (
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {card.hint}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="bg-card/60 border rounded-[2rem] p-8 space-y-8">
        <h2 className="text-xl font-black italic uppercase tracking-tight">
          {t("revenueChart")}
        </h2>
        <RevenueChart points={revenue} caption={t("revenueCaption")} />
      </section>

      <section className="bg-card/60 border rounded-[2rem] p-8 space-y-8">
        <h2 className="text-xl font-black italic uppercase tracking-tight">
          {t("topProducts")}
        </h2>

        {topProducts.length === 0 ? (
          <p className="text-sm font-black uppercase tracking-widest opacity-70">
            {t("noSales")}
          </p>
        ) : (
          <table className="w-full text-left">
            <caption className="sr-only">{t("topProductsCaption")}</caption>
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                <th scope="col" className="pb-4">{t("product")}</th>
                <th scope="col" className="pb-4 text-right">{t("units")}</th>
                <th scope="col" className="pb-4 text-right">{t("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.productId} className="border-t">
                  <td className="py-4">
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-black italic uppercase tracking-tight hover:text-primary-text transition-colors"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-4 text-right font-black">{product.quantity}</td>
                  <td className="py-4 text-right font-black">
                    {money(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function AnalyticsPage(props: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <AnalyticsContent {...props} />
    </Suspense>
  );
}
