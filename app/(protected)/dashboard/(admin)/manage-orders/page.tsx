// app/admin/orders/page.tsx
import { getAdminOrders } from "@/actions/admin/orders";
import { AdminOrdersList } from "../../_components/admin-orders-list";
import { PaginationControls } from "@/components/pagination-controls";
import { SearchOrders } from "@/components/search-orders";

export default async function AdminOrdersPage({
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

  const { orders, totalPages, totalCount } = await getAdminOrders(
    currentPage,
    15,
    searchQuery
  );

  return (
    <div className="container mx-auto py-20 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b pb-10">
        <div className="space-y-1">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">
            Terminal
          </h1>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">
            Active Records: {totalCount}
          </p>
        </div>
        <SearchOrders defaultValue={searchQuery} />
      </header>

      {/* Wyświetlamy listę - sprawdzamy czy orders to tablica */}
      <AdminOrdersList orders={orders || []} />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
      />
    </div>
  );
}
