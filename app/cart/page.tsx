"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getFreshCartData } from "@/actions/sync-cart";
import PriceFormatter from "@/components/PriceFormatter";
import QuantityButtons from "@/components/product-card/QuantityButtons";
import {
  Trash2,
  ArrowRight,
  AlertTriangle,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/cart/product-card";

const CartPage = () => {
  const {
    items,
    syncItems,
    deleteCartProduct,
    getTotalPrice,
    getSubTotalPrice,
    isMounted,
  } = useCart();
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const sync = async () => {
      if (isMounted && items.length > 0) {
        const freshData = await getFreshCartData(
          items.map((i) => i.product.id)
        );
        syncItems(freshData);
      }
      setIsSyncing(false);
    };
    sync();
  }, [isMounted]);

  if (!isMounted || isSyncing) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">
          Verifying Stock...
        </p>
      </div>
    );
  }

  // Looking for error inside cart
  // Product now can be out of stock or we can have more items than in stock
  const hasErrors = items.some(
    (item) =>
      item.product.stock === 0 || item.quantity > (item.product.stock || 0)
  );

  // No items in stock
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 text-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <ShoppingBag size={120} className="opacity-5 italic" />
            <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              Empty Bag
            </h1>
          </div>
          <Link
            href="/"
            className="group relative px-12 py-6 bg-zinc-900 text-white rounded-full overflow-hidden transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 font-black uppercase italic tracking-tighter text-xl">
              Find a Dream
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="flex justify-between items-end mb-16 border-b border-black/5 pb-10 font-black italic uppercase tracking-tighter">
        <h1 className="text-7xl">Your Bag</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => {
            const stock = item.product.stock || 0;
            const isOutOfStock = stock === 0;
            const isOverLimit = item.quantity > stock;

            return (
              <ProductCard
                key={item.product.id}
                item={item}
                stock={stock}
                isOutOfStock={isOutOfStock}
                isOverLimit={isOverLimit}
                deleteCartProduct={deleteCartProduct}
              />
            );
          })}
        </div>

        {/* SUMMARY */}
        <div className="lg:col-span-4">
          <div className="sticky top-10 p-12 shadow-2xl space-y-10 bg-card rounded-[2rem]">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-tight">
              Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-t  pt-8 mt-8">
                <span className="text-lg font-black uppercase tracking-[0.4em] opacity-40">
                  Grand Total
                </span>
                <span className="text-5xl font-black italic tracking-tighter text-primary">
                  <PriceFormatter amount={getTotalPrice()} />
                </span>
              </div>
            </div>

            {hasErrors && (
              <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                Please resolve stock issues before checkout
              </p>
            )}

            <button
              disabled={hasErrors}
              className={cn(
                "group relative w-full h-24 rounded-full overflow-hidden transition-all shadow-xl active:scale-95",
                hasErrors
                  ? "cursor-not-allowed bg-destructive/25 text-white"
                  : "bg-primary text-white hover:scale-[1.02]"
              )}
            >
              {!hasErrors && (
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              )}
              <div className="relative z-10 flex items-center justify-center gap-4 text-2xl font-black uppercase italic tracking-tighter">
                <span>{hasErrors ? "Fix Issues" : "Secure Flow"}</span>
                <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
