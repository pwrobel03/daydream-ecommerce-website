"use client";

import { ProductType } from "@/types/product";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import PriceFormatter from "./PriceFormatter";
import QuantityButtons from "./QuantityButtons";
import { useCart } from "@/hooks/use-cart";

const AddToCartButton = ({
  product,
  className,
}: {
  product: ProductType;
  className?: string;
}) => {
  const { addItem, getItemCount, isMounted } = useCart();
  const itemCount = isMounted ? getItemCount(product.id) : 0;

  const currentPrice = product.promoPrice
    ? Number(product.promoPrice)
    : Number(product.price);
  const lineSubtotal = currentPrice * itemCount;

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`Added ${product.name} to cart`, {
      style: { borderRadius: "20px", fontWeight: "bold" },
    });
  };

  return (
    <div className={cn("w-full transition-all duration-500", className)}>
      {itemCount === 0 ? (
        <Button
          className="w-full h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all duration-500 group overflow-hidden shadow-xl shadow-black/5"
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !isMounted}
        >
          <div className="relative z-10 flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-lg">
            <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Grab the dream</span>
          </div>
        </Button>
      ) : (
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[2.5rem] p-4 shadow-2xl animate-in zoom-in-95 duration-500">
          {/* NAGŁÓWEK SEKCJI (Mini Editorial Style) */}
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
              In your dream
            </span>
            <QuantityButtons product={product} />
          </div>

          {/* PODSUMOWANIE CENY */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              Subtotal
            </span>

            <div className="text-right">
              {product.promoPrice && (
                <div className="text-[10px] text-muted-foreground line-through opacity-50 font-light">
                  <PriceFormatter amount={Number(product.price) * itemCount} />
                </div>
              )}
              <div className="text-2xl font-black italic tracking-tighter text-zinc-900 dark:text-white">
                <PriceFormatter amount={lineSubtotal} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
