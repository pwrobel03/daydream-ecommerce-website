import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getUserOrders } from "@/lib/db-orders";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrdersList } from "../_components/orders-list";

async function OrdersPageContent() {
  const t = await getTranslations("dashboard.orderList");
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("subtitle")}</p>
      </header>

      <OrdersList orders={orders} />
    </div>
  );
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Deklaracja języka w powłoce — bez niej pobranie tłumaczeń wewnątrz
  // Suspense wciąga całą trasę w tryb dynamiczny.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<RowsSkeleton />}>
      <OrdersPageContent />
    </Suspense>
  );
}
