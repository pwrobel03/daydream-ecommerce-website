"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Search, MapPin, Package, RefreshCw } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/admin/admin-orders";

export function AdminOrdersList({ orders }: { orders: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filtrowanie po ID lub Nazwisku klienta
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setLoadingId(orderId);
    await updateOrderStatus(orderId, newStatus);
    setLoadingId(null);
  };

  return (
    <div className="space-y-8">
      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
        <input
          type="text"
          placeholder="SEARCH BY ORDER ID OR CLIENT..."
          className="w-full bg-transparent border-2 border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-black italic uppercase tracking-tighter focus:border-primary outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="w-full overflow-x-scroll">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-foreground uppercase font-black italic text-[10px] tracking-widest">
              <th className="pb-4 px-2">Logistics ID</th>
              <th className="pb-4 px-2">Target Address</th>
              <th className="pb-4 px-2">Manifest</th>
              <th className="pb-4 px-2 text-right">Credit</th>
              <th className="pb-4 px-2 text-center">Protocol Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                {/* ID & DATE */}
                <td className="py-6 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-primary">
                      #{order.id.slice(-12).toUpperCase()}
                    </span>
                    <span className="font-bold tracking-tighter italic uppercase">
                      {format(new Date(order.createdAt), "dd.MM.yyyy HH:mm")}
                    </span>
                    <span className="text-[9px] uppercase font-black opacity-30 mt-1">
                      {order.user.name}
                    </span>
                  </div>
                </td>

                {/* ADDRESS */}
                <td className="py-6 px-2">
                  <div className="flex items-start gap-2 max-w-[250px]">
                    <MapPin className="w-4 h-4 mt-1 opacity-30 shrink-0" />
                    <div className="flex flex-col text-[11px] font-bold uppercase leading-tight">
                      <span>{order.address?.street}</span>
                      <span>
                        {order.address?.zipCode} {order.address?.city}
                      </span>
                      <span className="opacity-40 mt-1 font-mono">
                        {order.address?.phone}
                      </span>
                    </div>
                  </div>
                </td>

                {/* ITEMS */}
                <td className="py-6 px-2">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 mt-0.5 opacity-30 shrink-0" />
                    <div className="flex flex-col gap-1">
                      {order.items.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold uppercase truncate max-w-[150px]"
                        >
                          {item.quantity}x {item.product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>

                {/* TOTAL */}
                <td className="py-6 px-2 text-right">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black italic tracking-tighter">
                      {order.totalAmount.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        order.isPaid ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {order.isPaid ? "Signal: Received" : "Signal: Missing"}
                    </span>
                  </div>
                </td>

                {/* STATUS UPDATER */}
                <td className="py-6 px-2 text-center">
                  <div className="relative inline-block">
                    {loadingId === order.id && (
                      <RefreshCw className="absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                    )}
                    <select
                      value={order.status}
                      disabled={loadingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className={cn(
                        "appearance-none bg-transparent border-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest cursor-pointer outline-none transition-all",
                        order.status === "DELIVERED" &&
                          "border-green-500/20 text-green-600 bg-green-500/5",
                        order.status === "PENDING" &&
                          "border-yellow-500/20 text-yellow-600 bg-yellow-500/5",
                        order.status === "SHIPPED" &&
                          "border-primary/20 text-primary bg-primary/5",
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
    </div>
  );
}
