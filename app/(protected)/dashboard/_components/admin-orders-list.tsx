// app/admin/_components/admin-orders-list.tsx
"use client";

import { useState } from "react";
import { format, toDate } from "date-fns";
import { updateOrderStatus } from "@/actions/admin/orders";
import PriceFormatter from "@/components/PriceFormatter";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Package,
  RefreshCw,
  User,
  Phone,
  ChevronDown,
} from "lucide-react";
import { OrderStatus } from "@/lib/generated/prisma/client";
import type { AdminOrderType } from "@/types/order";

export function AdminOrdersList({ orders = [] }: { orders: AdminOrderType[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoadingId(orderId);
    await updateOrderStatus(orderId, newStatus as OrderStatus);
    setLoadingId(null);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[3rem]">
        <p className="text-muted-foreground font-black italic text-xl uppercase tracking-tighter opacity-20">
          Archive Empty / Sector Clear
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto overflow-y-auto max-h-[650px]">
      <table className="w-full text-left">
        <thead>
          <tr className="uppercase font-black italic text-[10px] tracking-widest text-muted-foreground/60">
            {/* 2. NAGŁÓWKI: sticky top-0 + bg-background + z-index */}
            <th className="sticky top-0 z-20 py-4 text-sm bg-background">
              ID / Registry
            </th>
            <th className="sticky top-0 z-20 py-4 text-sm bg-background">
              Destination
            </th>
            <th className="sticky top-0 z-20 py-4 text-sm bg-background">
              Manifest
            </th>
            <th className="sticky top-0 z-20 py-4 text-sm bg-background">
              Value
            </th>
            <th className="sticky top-0 z-20 py-4 text-sm bg-background">
              Status Protocol
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order.id} className="group px-4 transition-colors">
              {/* KOLUMNA 1: ID */}
              <td className="py-8 px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-primary italic">
                    #{order.id.slice(-12).toUpperCase()}
                  </span>
                  <span className="font-black tracking-tighter italic uppercase text-lg leading-none mt-1">
                    {format(new Date(order.createdAt), "dd.MM.yyyy")}
                  </span>
                  <div className="flex items-center gap-1 mt-2 opacity-40">
                    <User className="w-3 h-3" />
                    <span className="text-[9px] uppercase font-black tracking-tighter">
                      {order.user?.name}
                    </span>
                  </div>
                </div>
              </td>

              {/* KOLUMNA 2: ADRES */}
              {order.address ? (
                <td className="py-8 px-2">
                  <div className="flex items-start gap-3 max-w-[280px]">
                    <MapPin className="w-4 h-4 mt-1 opacity-20 shrink-0 text-primary" />
                    <div className="flex flex-col text-[11px] font-bold uppercase leading-tight tracking-tighter">
                      <span className="text-foreground font-black italic mb-1">
                        {order.address?.fullName}
                      </span>
                      <span className="opacity-50">
                        {order.address?.street}
                      </span>
                      <span className="opacity-50">
                        {order.address?.zipCode} {order.address?.city}
                      </span>
                      <div className="flex items-center gap-1 mt-2 text-primary font-mono text-[9px]">
                        <Phone className="w-3 h-3 opacity-40" />{" "}
                        {order.address?.phone}
                      </div>
                    </div>
                  </div>
                </td>
              ) : (
                <td className="py-8 px-2">
                  <div className="flex items-start gap-3 max-w-[280px]">
                    <MapPin className="w-4 h-4 opacity-20 shrink-0 text-primary" />
                    <div className="flex flex-col text-[11px] font-bold uppercase leading-tight tracking-tighter">
                      <span className="text-foreground font-black italic mb-1">
                        Address is missing
                      </span>
                    </div>
                  </div>
                </td>
              )}

              {/* KOLUMNA 3: PRZEDMIOTY */}
              <td className="py-8 px-2">
                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 mt-1 opacity-20 shrink-0" />
                  <div className="flex flex-col gap-2">
                    {order.items?.map((item, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[9px] font-black border border-primary/20 px-1.5 py-0.5 rounded italic">
                          {item.quantity}X
                        </span>
                        <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                          {item.product?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </td>

              {/* KOLUMNA 4: CENA */}
              <td className="py-8 px-2 text-right">
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter leading-none">
                    <PriceFormatter amount={Number(order.totalAmount)} />
                  </span>
                  <div
                    className={cn(
                      "text-[8px] font-black uppercase tracking-[0.2em] mt-3 inline-flex items-center justify-start gap-1.5",
                      order.isPaid ? "text-emerald-500" : "text-destructive"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 h-1 rounded-full",
                        order.isPaid
                          ? "bg-emerald-500 shadow-[0_0_8px_green]"
                          : "bg-destructive"
                      )}
                    />
                    {order.isPaid ? "Credit Valid" : "Credit Missing"}
                  </div>
                </div>
              </td>

              {/* KOLUMNA 5: STATUS (POWRÓT DO TWOJEGO STYLU) */}
              <td className="py-8 px-2 text-center">
                <div className="relative inline-block min-w-[140px]">
                  {/* Wskaźnik ładowania po lewej */}
                  {loadingId === order.id && (
                    <RefreshCw className="absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                  )}

                  {/* Customowa strzałka po prawej */}
                  <div
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300",
                      "group-hover/select:translate-y-[-30%]", // Mały efekt przy najechaniu
                      order.status === "DELIVERED" && "text-emerald-500",
                      order.status === "PENDING" && "text-amber-500",
                      order.status === "PAID" && "text-blue-500",
                      order.status === "SHIPPED" && "text-primary",
                      order.status === "CANCELLED" && "text-destructive"
                    )}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[3px]" />
                  </div>

                  <select
                    value={order.status}
                    disabled={loadingId === order.id}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    className={cn(
                      "appearance-none bg-transparent border-2 pl-6 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest cursor-pointer outline-none transition-all duration-300 w-full",
                      // KOLORYSTYKA NEXUS
                      order.status === "DELIVERED" &&
                        "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10",
                      order.status === "PENDING" &&
                        "border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10",
                      order.status === "PAID" &&
                        "border-blue-500/30 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10",
                      order.status === "SHIPPED" &&
                        "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10",
                      order.status === "CANCELLED" &&
                        "border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10",
                      loadingId === order.id && "opacity-30 cursor-wait"
                    )}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
