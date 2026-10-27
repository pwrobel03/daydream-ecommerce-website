"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { updateOrderStatus } from "@/actions/admin/orders";
import { nextOrderStatus } from "@/lib/order-transitions";
import PriceFormatter from "@/components/PriceFormatter";
import { OrderStatus } from "@/lib/generated/prisma/client";
import type { AdminOrder, MaskedAdminOrder, getAdminOrders } from "@/lib/db-orders";
import { OrderStatusBadge } from "./orders-list";

export function AdminOrdersList({
  result,
  searching = false,
}: {
  result: Awaited<ReturnType<typeof getAdminOrders>>;
  searching?: boolean;
}) {
  const orders: (AdminOrder | MaskedAdminOrder)[] = result.orders;
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const readOnlyReason = useReadOnlyReason();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoadingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus as OrderStatus);
      if (!res.ok) toast.error(res.message); // the controlled select snaps back to the stored status
    } catch {
      toast.error(t("orders.statusChangeFailed"));
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {searching ? t("orders.emptySearch") : t("orders.empty")}
      </p>
    );
  }

  return (
    <div className="max-h-[650px] w-full overflow-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t("orders.listCaption")}</caption>
        <thead>
          <tr className="text-muted-foreground">
            {(["order", "address", "items", "total", "statusColumn"] as const).map((key) => (
              <th
                key={key}
                scope="col"
                className="sticky top-0 z-10 border-b bg-background px-4 py-3 font-medium"
              >
                {t(`orders.${key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => {
            const masked = "customerTag" in order;
            const number = order.id.slice(-8);
            const next = nextOrderStatus(order.status);

            return (
              <tr key={order.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-mono font-medium tabular-nums">#{number}</p>
                  <time
                    dateTime={new Date(order.createdAt).toISOString()}
                    className="block text-muted-foreground tabular-nums"
                  >
                    {format.dateTime(new Date(order.createdAt), {
                      dateStyle: "medium",
                      timeZone: "Europe/Warsaw",
                    })}
                  </time>
                  {/* break-all: a 254-character e-mail has no break opportunity */}
                  <p className="mt-1 max-w-56 break-all text-muted-foreground">
                    {masked ? t("orders.customer", { tag: order.customerTag }) : order.user.name}
                  </p>
                </td>

                <td className="px-4 py-4">
                  {masked ? (
                    // The demo admin never receives the address (ADR 0009).
                    <span className="text-muted-foreground">{t("orders.hiddenInDemo")}</span>
                  ) : order.address ? (
                    <div className="max-w-64 break-words">
                      <span className="block font-medium">{order.address.fullName}</span>
                      <span className="block text-muted-foreground">{order.address.street}</span>
                      <span className="block text-muted-foreground">
                        {order.address.zipCode} {order.address.city}
                      </span>
                      <span className="block text-muted-foreground tabular-nums">
                        {order.address.phone}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t("orders.addressMissing")}</span>
                  )}
                </td>

                <td className="px-4 py-4">
                  <ul className="flex flex-col gap-1">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="flex max-w-64 gap-2">
                        <span className="tabular-nums text-muted-foreground">{item.quantity}×</span>
                        <span className="truncate">{item.product?.name}</span>
                      </li>
                    ))}
                  </ul>
                </td>

                <td className="px-4 py-4">
                  <PriceFormatter
                    amount={Number(order.totalAmount)}
                    className="font-medium tabular-nums"
                  />
                  <p className="text-muted-foreground">
                    {order.isPaid ? t("status.creditValid") : t("status.creditMissing")}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {next && (
                      <select
                        aria-label={t("orders.changeStatus", { number })}
                        value={order.status}
                        disabled={loadingId === order.id || !!readOnlyReason}
                        title={readOnlyReason}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value={order.status}>{t(`status.${order.status}`)}</option>
                        <option value={next}>{t(`status.${next}`)}</option>
                      </select>
                    )}
                    {loadingId === order.id && (
                      <RefreshCw aria-hidden className="size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
