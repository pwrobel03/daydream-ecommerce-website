import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAdminOrders } from "@/lib/db-orders";
import { AdminOrdersList } from "../../_components/admin-orders-list";
import { PaginationControls } from "@/components/pagination-controls";
import { SearchOrders } from "@/components/search-orders";

async function AdminOrdersPageContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  // Rozpakowanie parametrów - BEZ TEGO NIE ZADZIAŁA W NEXT 15
  const sParams = await searchParams;
  const page = sParams.page;
  const q = sParams.q;

  const currentPage = parseInt(page || "1", 10);
  const searchQuery = q || "";

  const t = await getTranslations("dashboard.orders");
  const result = await getAdminOrders(
    currentPage,
    15,
    searchQuery
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("count", { count: result.totalCount })}
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-9 w-full max-w-md" />}>
          <SearchOrders defaultValue={searchQuery} />
        </Suspense>
      </header>

      {/* Wyświetlamy listę - sprawdzamy czy orders to tablica */}
      <AdminOrdersList result={result} searching={!!searchQuery} />

      <PaginationControls
        currentPage={currentPage}
        totalPages={result.totalPages}
        searchQuery={searchQuery}
      />
    </div>
  );
}


export default function AdminOrdersPage(props: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <AdminOrdersPageContent {...props} />
    </Suspense>
  );
}
