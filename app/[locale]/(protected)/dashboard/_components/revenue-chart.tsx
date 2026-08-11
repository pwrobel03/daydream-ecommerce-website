"use client";

import { useFormatter } from "next-intl";
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
export function RevenueChart({ points }: { points: RevenuePoint[] }) {
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border/40"
          />
          <XAxis
            dataKey="day"
            interval={tickInterval}
            tickFormatter={(day: string) => day.slice(5)}
            tickLine={false}
            axisLine={false}
            className="text-[10px] font-black uppercase tracking-widest"
          />
          <YAxis
            tickFormatter={money}
            tickLine={false}
            axisLine={false}
            width={72}
            className="text-[10px] font-black uppercase tracking-widest"
          />
          <Tooltip
            cursor={{ className: "fill-primary/10" }}
            contentStyle={{
              borderRadius: "1rem",
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: "12px",
            }}
            formatter={(value) => money(Number(value))}
          />
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            className="fill-primary"
            // Wykres pokazuje historię, nie zmianę stanu — animacja przy
            // każdym renderze byłaby ozdobnikiem, a nie informacją.
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
