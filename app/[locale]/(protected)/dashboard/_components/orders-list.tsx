"use client";

import { useFormatter, useTranslations } from "next-intl";

import PriceFormatter from "@/components/PriceFormatter";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { UserOrder } from "@/lib/db-orders";

interface OrdersListProps {
  orders: UserOrder[];
}

const STATUS_VARIANT = {
  PAID: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  PENDING: "secondary",
} as const;

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("dashboard");
  const known = status in STATUS_VARIANT;

  return (
    <Badge variant={known ? STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] : "secondary"}>
      {known ? t(`status.${status as keyof typeof STATUS_VARIANT}`) : status}
    </Badge>
  );
}

export function OrdersList({ orders }: OrdersListProps) {
  const t = useTranslations("dashboard");
  const format = useFormatter();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <Package size={24} className="text-muted-foreground" />
        <p className="font-medium">{t("orderList.empty")}</p>
        <p className="text-sm text-muted-foreground">{t("orderList.emptyHint")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const number = order.id.slice(-8);
        return (
          <li key={order.id}>
            <Link
              href={`/dashboard/orders/${order.id}`}
              aria-label={t("orderList.view", { number })}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-mono text-sm font-medium tabular-nums">#{number}</p>
                <time
                  dateTime={new Date(order.createdAt).toISOString()}
                  className="block text-sm text-muted-foreground tabular-nums"
                >
                  {format.dateTime(new Date(order.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Europe/Warsaw",
                  })}
                </time>
              </div>
              <OrderStatusBadge status={order.status} />
              <PriceFormatter
                amount={Number(order.totalAmount)}
                className="tabular-nums"
              />
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
