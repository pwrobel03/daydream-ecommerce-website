import { Suspense } from "react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { days: range })}
          </p>
        </div>

        <nav aria-label={t("rangeLabel")} className="flex gap-2">
          {RANGES.map((option) => (
            <Button
              key={option}
              asChild
              size="sm"
              variant={option === range ? "default" : "outline"}
            >
              <Link
                href={`?days=${option}`}
                aria-current={option === range ? "page" : undefined}
              >
                {t("rangeOption", { days: option })}
              </Link>
            </Button>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
            {card.hint && (
              <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold leading-[1.35]">{t("revenueChart")}</h2>
        <RevenueChart points={revenue} caption={t("revenueCaption")} />
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold leading-[1.35]">{t("topProducts")}</h2>

        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSales")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t("topProductsCaption")}</caption>
              <thead>
                <tr className="text-muted-foreground">
                  <th scope="col" className="pb-3 font-medium">{t("product")}</th>
                  <th scope="col" className="pb-3 text-right font-medium">{t("units")}</th>
                  <th scope="col" className="pb-3 text-right font-medium">{t("revenue")}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.productId} className="border-t">
                    <td className="max-w-0 truncate py-3 pr-4">
                      <Link
                        href={`/product/${product.slug}`}
                        className="hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right tabular-nums">{product.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{money(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
