"use client";

import { ProductType } from "@/types/product";
import React from "react";
import { cn } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import PriceFormatter from "../PriceFormatter";
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
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !isMounted}
          className={cn(
            "group relative w-full h-16 rounded-full overflow-hidden transition-all duration-300",
            "bg-foreground dark:bg-white text-white dark:text-background",
            "hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          )}
        >
          {/* TŁO ANIMOWANE (COVER) */}
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />

          {/* TREŚĆ PRZYCISKU */}
          <div className="relative z-10 flex items-center justify-center gap-3 text-lg font-black uppercase italic tracking-tighter group-hover:text-white transition-colors duration-300">
            <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>Grab the dream</span>
            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75" />
          </div>
        </button>
      ) : (
        <div className="bg-muted/20 backdrop-blur-xl border rounded-[2.5rem] p-4 shadow-2xl animate-in zoom-in-95 duration-500">
          {/* NAGŁÓWEK SEKCJI */}
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary italic">
              In your dream
            </span>
            <QuantityButtons product={product} />
          </div>

          {/* PODSUMOWANIE CENY */}
          <div className="pt-3 border-t flex items-center justify-between px-2">
            <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">
              Subtotal
            </span>

            <div className="text-right">
              {product.promoPrice && (
                <div className="text-xs text-muted-foreground line-through opacity-50 font-light">
                  <PriceFormatter amount={Number(product.price) * itemCount} />
                </div>
              )}
              <div className="text-2xl font-black italic tracking-tighter">
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
