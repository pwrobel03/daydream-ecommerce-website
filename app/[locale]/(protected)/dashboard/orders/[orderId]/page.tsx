import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getUserOrderDetails } from "@/lib/db-orders";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import PriceFormatter from "@/components/PriceFormatter";
import { OrderItemCard } from "../../_components/order-item-card";
import { OrderStatusBadge } from "../../_components/orders-list";
import { RetryPaymentButton } from "../../_components/retry-payment-button";

async function OrderDetailsPageContent({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard.orderDetail");
  const tDashboard = await getTranslations("dashboard");
  const format = await getFormatter();
  const session = await getSession();

  if (!session?.user?.id) redirect("/auth/login");

  const order = await getUserOrderDetails(session.user.id, orderId);

  if (!order) notFound();

  const createdAt = new Date(order.createdAt);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-0">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("number")}{" "}
            <span className="font-mono tabular-nums break-all">{order.id}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          <time
            dateTime={createdAt.toISOString()}
            className="text-sm text-muted-foreground tabular-nums"
          >
            {format.dateTime(createdAt, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Europe/Warsaw",
            })}
          </time>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold leading-[1.35]">{t("items")}</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <OrderItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold leading-[1.35]">
            {tDashboard("labels.deliveryAddress")}
          </h2>
          {order.address ? (
            <div className="space-y-1 text-sm break-words">
              <p className="font-medium">{order.address.fullName}</p>
              <p>{order.address.street}</p>
              <p className="tabular-nums">
                {order.address.zipCode} {order.address.city}
              </p>
              <p className="pt-2 text-muted-foreground tabular-nums">
                {t("phone")}: {order.address.phone}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tDashboard("orders.noAddress")}
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold leading-[1.35]">{t("payment")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{tDashboard("labels.status")}</dt>
              <dd>
                <OrderStatusBadge status={order.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-2">
              <dt className="text-muted-foreground">{t("total")}</dt>
              <dd>
                <PriceFormatter
                  amount={Number(order.totalAmount)}
                  className="text-lg tabular-nums"
                />
              </dd>
            </div>
          </dl>

          {!order.isPaid && order.status === "PENDING" && (
            <RetryPaymentButton orderId={order.id} />
          )}
        </section>
      </div>
    </div>
  );
}

export default function OrderDetailsPage(props: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  // orderId is dynamic: awaiting params in the shell would block the whole route.
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <OrderDetailsPageContent {...props} />
    </Suspense>
  );
}
