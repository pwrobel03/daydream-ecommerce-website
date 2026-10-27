"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/lib/db-analytics";

/**
 * Jedyny komponent kliencki w tym widoku — recharts mierzy kontener, więc musi
 * działać w przeglądarce. Dane przychodzą gotowe z serwera; tutaj nie ma
 * żadnego pobierania ani liczenia.
 */
export function RevenueChart({
  points,
  caption,
}: {
  points: RevenuePoint[];
  caption: string;
}) {
  const t = useTranslations("dashboard.analytics");
  const format = useFormatter();

  const money = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  // Etykiety co kilka dni — przy 30 punktach wszystkie nachodziłyby na siebie.
  const tickInterval = Math.max(0, Math.floor(points.length / 6) - 1);

  return (
    <>
      {/* Ta sama treść w formie, którą czytnik ekranu potrafi przekazać.
          Sam SVG jest dla niego pusty, a przychód dzienny to jedyna dana
          na tym ekranie, której nie da się odczytać inaczej. */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t("dayColumn")}</th>
            <th scope="col">{t("revenue")}</th>
            <th scope="col">{t("ordersColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <th scope="row">{point.day}</th>
              <td>{money(point.revenue)}</td>
              <td>{point.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-hidden="true" data-chart-surface className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="day"
            interval={tickInterval}
            tickFormatter={(day: string) => day.slice(5)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={money}
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: "14px",
              color: "var(--card-foreground)",
            }}
            formatter={(value) => money(Number(value))}
          />
          <Bar
            dataKey="revenue"
            name={t("chartRevenue")}
            radius={[4, 4, 0, 0]}
            fill="var(--chart-1)"
            // Wykres pokazuje historię, nie zmianę stanu — animacja przy
            // każdym renderze byłaby ozdobnikiem, a nie informacją.
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}
