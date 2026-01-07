// app/admin/orders/page.tsx
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminOrdersList } from "../../_components/admin-orders-list";

export default async function AdminOrdersPage() {
  const session = await auth();

  // 1. GUARD: Tylko dla ADMINA
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // 2. Pobieramy WSZYSTKIE zamówienia wraz z danymi klienta
  const orders = await db.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      address: true,
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. Serializacja (Decimal -> Number, Date -> String)
  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return (
    <div className="container mx-auto py-20 flex flex-col space-y-16">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-10 gap-6">
        <div className="space-y-1 overflow-hidden">
          <h1 className="text-5xl sm:text-8xl font-black italic uppercase tracking-tighter leading-[0.8]">
            Master Control
          </h1>
          <p className="text-md font-black uppercase tracking-[0.4em] text-primary ml-1">
            Global Logistics & Order Management
          </p>
        </div>

        {/* Statystyka w stylu Nexus */}
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-40">
              Total Volume
            </span>
            <span className="text-2xl font-black italic">
              {serializedOrders.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase opacity-40">
              Active Tasks
            </span>
            <span className="text-2xl font-black italic text-primary">
              {serializedOrders.filter((o) => o.status === "PENDING").length}
            </span>
          </div>
        </div>
      </header>

      <AdminOrdersList orders={serializedOrders} />
    </div>
  );
}
