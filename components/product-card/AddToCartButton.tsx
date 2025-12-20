"use client";

import { ProductType } from "@/types/product";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
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

  // LOGIKA CENOWA
  const hasPromo =
    product.promoPrice !== null && product.promoPrice !== undefined;
  const currentPrice = hasPromo
    ? Number(product.promoPrice)
    : Number(product.price);

  // Kalkulacja sumy dla tej linii (ilość * cena aktualna)
  const lineSubtotal = currentPrice * itemCount;

  // Kalkulacja sumy "starej" (ilość * cena bazowa) - tylko jeśli jest promocja
  const lineBaseTotal = Number(product.price) * itemCount;

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`Added ${product.name} to cart`);
  };

  return (
    <div
      className={cn("w-full, min-h-26 flex flex-col justify-center", className)}
    >
      {itemCount === 0 ? (
        <Button
          className="w-full bg-primary/40 border-2 border-primary hover:bg-primary text-foreground hover:text-white transition-all duration-300 font-bold capitalize"
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !isMounted}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          add to cart
        </Button>
      ) : (
        <div className="text-sm p-3 bg-card/30 rounded-md animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
          {/* SEKCJA ILOŚCI */}
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Quantity
            </span>
            <QuantityButtons product={product} />
          </div>

          {/* SEKCJA PODSUMOWANIA LINII */}
          <div className="flex flex-col border-t border-foreground/50 gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] self-end uppercase font-black tracking-widest">
                Sub Total
              </span>

              <div className="flex flex-col items-end pt-1">
                {/* Cena Bazowa (Przekreślona) - pokazujemy tylko przy promocji */}
                {hasPromo && (
                  <div className="text-[10px] text-muted-foreground line-through decoration-primary/50">
                    <PriceFormatter amount={lineBaseTotal} />
                  </div>
                )}

                {/* Cena Faktyczna (Subtotal) */}
                <div className="font-black italic text-lg leading-none text-primary">
                  <PriceFormatter amount={lineSubtotal} />
                </div>
              </div>
            </div>

            {/* Informacja o oszczędności (opcjonalnie) */}
            {/* {hasPromo && (
              <div className="text-[9px] text-right font-bold text-emerald-600 uppercase">
                You save:{" "}
                <PriceFormatter amount={lineBaseTotal - lineSubtotal} />
              </div>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
