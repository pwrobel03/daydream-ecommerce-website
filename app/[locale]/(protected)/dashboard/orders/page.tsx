import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getUserOrders } from "@/lib/db-orders";
import { redirect } from "next/navigation";
import { OrdersList } from "../_components/orders-list";

async function OrdersPageContent() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="container mx-auto py-20 flex flex-col space-y-16">
      <header className="flex justify-between items-end border-b pb-10">
        <div className="space-y-1 overflow-hidden">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
            Archive
          </h1>
          <p className="text-md font-black uppercase tracking-[0.4em] opacity-70 ml-1">
            Order History & Status Tracking
          </p>
        </div>
      </header>

      {/* Przekazujemy dane do komponentu prezentacyjnego */}
      <OrdersList orders={orders} />
    </div>
  );
}


export default function OrdersPage() {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <OrdersPageContent />
    </Suspense>
  );
}
