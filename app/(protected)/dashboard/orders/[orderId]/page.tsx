import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import PriceFormatter from "@/components/PriceFormatter";
import { OrderItemCard } from "../../_components/order-item-card";
import { Truck, MapPin, CreditCard, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RetryPaymentButton } from "../../_components/retry-payment-button";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();
  const { orderId } = await params;

  if (!session) redirect("/auth/login");

  // app/dashboard/orders/[orderId]/page.tsx

  const order = await db.order.findUnique({
    where: {
      id: orderId,
      userId: session.user.id,
    },
    include: {
      address: true,
      items: {
        include: {
          product: {
            include: {
              images: true, // TO BYŁ BRAKUJĄCY ELEMENT
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  // SERIALIZACJA DANYCH (Konwersja Decimal -> Number)
  const serializedOrder = {
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
      product: {
        ...item.product,
        // Teraz images będą dostępne tutaj:
        images: item.product.images.map((img) => ({
          url: img.url,
        })),
      },
    })),
  };

  return (
    <div className="container mx-auto py-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16 border-b pb-12">
        <div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Order Detail
          </h1>
          <p className="text-xs font-black uppercase tracking-[0.5em] opacity-40 mt-4">
            Reference: {order.id}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase italic tracking-widest",
              order.isPaid
                ? "bg-green-500 text-white"
                : "bg-amber-500 text-black"
            )}
          >
            {order.status}
          </span>
          <p className="text-sm text-right font-bold opacity-40">
            {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        {/* Lewa kolumna: Produkty */}
        <div className="lg:col-span-12 space-y-6">
          <h2 className="text-3xl font-black italic uppercase tracking-tight flex items-center gap-3">
            <Package className="text-primary" /> Manifest
          </h2>
          <div className="space-y-4">
            {serializedOrder.items.map((item) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Dane dostawy i płatności */}
        <div className="grid grid-cols-1 lg:grid-cols-12 space-y-8 lg:gap-12">
          {/* Adres */}
          <div className="lg:col-span-6 bg-card p-10 rounded-[2rem] shadow-xl space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-widest flex items-center gap-3">
              <MapPin size={20} className="text-primary" /> Destination
            </h3>
            {order.address ? (
              <div className="space-y-1 font-bold uppercase text-sm tracking-tight opacity-70">
                <p className="text-lg">{order.address.fullName}</p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.zipCode} {order.address.city}
                </p>
                <p className="pt-4 text-sm opacity-40">
                  Phone: {order.address.phone}
                </p>
              </div>
            ) : (
              <p className="italic opacity-30">No address provided</p>
            )}
          </div>

          {/* Podsumowanie finansowe */}
          <div className="lg:col-span-6 bg-card p-10 rounded-[2rem] space-y-8 shadow-xl">
            <h3 className="text-xl font-black italic uppercase tracking-widest flex items-center gap-3">
              <CreditCard size={20} /> Settlement
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4 text-primary">
                <span className="text-sm font-black uppercase">Status</span>
                <span className="font-black uppercase italic tracking-tighter text-xs">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="text-sm font-black uppercase opacity-40">
                  Grand Total
                </span>
                <span className="text-2xl font-black italic tracking-tighter text-primary">
                  <PriceFormatter amount={serializedOrder.totalAmount} />
                </span>
              </div>
            </div>

            {!order.isPaid && order.status === "PENDING" && (
              // <button className="w-full py-6 bg-primary text-white rounded-full font-black italic uppercase text-lg hover:scale-105 transition-all shadow-xl active:scale-95">
              //   Retry Payment
              // </button>
              <RetryPaymentButton orderId={serializedOrder.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
