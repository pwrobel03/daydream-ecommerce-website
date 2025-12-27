// app/dashboard/orders/_components/order-item-card.tsx
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Package } from "lucide-react";
import PriceFormatter from "@/components/PriceFormatter";
import Link from "next/link";

export const OrderItemCard = ({ item }: { item: any }) => {
  return (
    <div className="group relative flex flex-row items-center gap-4 p-4 md:gap-8 md:p-6 rounded-[1.5rem] border bg-card/60 transition-all hover:border-black/20">
      {/* Image */}
      <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-[1rem] overflow-hidden flex-shrink-0 relative border">
        {item.product.images?.[0]?.url ? (
          <Image
            src={item.product.images[0].url}
            alt={item.product.name}
            fill
            className="object-cover transition-all"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <ImageIcon size={20} className="opacity-20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full flex flex-col lg:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Link href={`/product/${item.product.slug}`}>
            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter leading-none">
              {item.product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black uppercase tracking-[0.2em] px-3 py-1 bg-input/60 rounded-full">
              QTY: {item.quantity}
            </span>
            <span className="text-sm font-bold opacity-40">
              <PriceFormatter amount={item.price} /> / unit
            </span>
          </div>
        </div>

        <div className="lg::text-right flex flex-col justify-center">
          <p className="text-sm font-black uppercase opacity-30 leading-none mb-1">
            Subtotal
          </p>
          <p className="text-3xl font-black italic tracking-tighter">
            <PriceFormatter amount={Number(item.price) * item.quantity} />
          </p>
        </div>
      </div>
    </div>
  );
};
