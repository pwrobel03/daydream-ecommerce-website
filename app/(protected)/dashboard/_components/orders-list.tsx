"use client";

import PriceFormatter from "@/components/PriceFormatter";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Van,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface OrdersListProps {
  orders: any[];
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-black/5 rounded-[3rem]">
        <Package size={48} className="opacity-10 mb-4" />
        <p className="text-sm font-black uppercase opacity-20 italic">
          No history found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="group relative bg-card/40 border rounded-[2rem] p-8 transition-all hover:shadow-2xl hover:border-transparent"
        >
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            {/* Sekcja 1: Główne Info */}
            <div className="space-y-6 flex-grow flex">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-zinc-900 text-white rounded-full">
                  #{order.id.slice(-8)}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 italic">
                  <Clock size={12} />
                  {format(new Date(order.createdAt), "dd MMM yyyy • HH:mm")}
                </div>
              </div>
            </div>

            {/* Sekcja 2: Status i Kwota */}
            <div className="flex flex-row flex-wrap lg:flex-col justify-between lg:justify-center items-end gap-4 min-w-[200px]">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">
                  Total
                </p>
                <p className="text-4xl font-black italic tracking-tighter">
                  <PriceFormatter amount={order.totalAmount} />
                </p>
              </div>

              <StatusIndicator status={order.status} isPaid={order.isPaid} />
            </div>

            {/* Link / Akcja */}
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="flex items-center justify-center lg:pl-6 border-t lg:border-t-0 lg:border-l cursor-pointer group/link"
            >
              <ChevronRight className="mt-2 lg:mt-0 opacity-40 rotate-90 lg:rotate-0 group-hover:opacity-100 group-hover:translate-y-2 lg:group-hover:translate-y-0 lg:group-hover:translate-x-2 transition-all" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIndicator({
  status,
  isPaid,
}: {
  status: string;
  isPaid: boolean;
}) {
  const configs: any = {
    PAID: {
      color: "text-green-500",
      icon: <CheckCircle2 size={14} />,
      label: "Paid",
    },
    PENDING: {
      color: "text-amber-500",
      icon: <Clock size={14} />,
      label: "Pending",
    },
    CANCELLED: {
      color: "text-red-500",
      icon: <XCircle size={14} />,
      label: "Canceled",
    },
    SHIPPED: {
      color: "text-green-500",
      icon: <Van size={14} />,
      label: "Shipped",
    },
    DELIVERED: {
      color: "text-green-500",
      icon: <Package size={14} />,
      label: "Delivered",
    },
  };

  const current = configs[status] || { color: "text-zinc-400", label: status };

  return (
    <div className="flex flex-col flex-wrap items-end my-auto">
      <div
        className={cn(
          "flex items-center gap-2 font-black uppercase italic text-xs tracking-widest",
          current.color
        )}
      >
        {current.icon}
        {current.label}
      </div>
      {!isPaid && status !== "CANCELLED" && (
        <span className="text-[8px] font-black uppercase bg-destructive/20 text-destructive px-2 py-0.5 rounded-full mt-1">
          Awaiting Payment
        </span>
      )}
    </div>
  );
}
