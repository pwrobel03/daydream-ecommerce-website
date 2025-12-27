import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OrdersList } from "../_components/orders-list";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Pobieramy zamówienia użytkownika
  const orders = await db.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: { take: 1 },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // serialize data
  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount), // Konwersja Decimal -> Number
    createdAt: order.createdAt.toISOString(), // Konwersja Date -> String (bezpieczniejsze)
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price), // Konwersja Decimal -> Number w produktach
    })),
  }));

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl flex flex-col space-y-16">
      <header className="flex justify-between items-end border-b pb-10">
        <div className="space-y-1 overflow-hidden">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
            Archive
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Order History & Status Tracking
          </p>
        </div>
      </header>

      {/* Przekazujemy dane do komponentu prezentacyjnego */}
      <OrdersList orders={serializedOrders} />
    </div>
  );
}
