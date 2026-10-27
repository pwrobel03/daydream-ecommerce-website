"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { CartProduct } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { MAX_UNITS_PER_LINE } from "@/lib/order-limits";
import { useTranslations } from "next-intl";

const QuantityButtons = ({ product }: { product: CartProduct }) => {
  const { addItem, removeItem, getItemCount, isMounted } = useCart();
  const itemCount = isMounted ? getItemCount(product?.id) : 0;
  const t = useTranslations("cart");
  const maxUnits = Math.min(MAX_UNITS_PER_LINE, product?.stock ?? 0);
  const isAtLimit = itemCount >= maxUnits;

  const handleIncrease = () => {
    if (isAtLimit) {
      toast.error(t("quantityLimit", { max: maxUnits }));
      return;
    }
    toast.success("Quantity increased");
    addItem(product);
  };

  return (
    <div className="flex items-center p-1 rounded-full border ">
      {/* MINUS */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-card/60 hover:shadow-sm transition-all hover:text-primary-text"
        onClick={() => {
          removeItem(product.id);
          toast.success("Quantity decreased");
        }}
        aria-label={t("decrease")}
        disabled={itemCount === 0 || !isMounted}
      >
        <Minus className="w-3 h-3" />
      </Button>

      {/* LICZNIK */}
      <div className="px-3 min-w-[2.5rem] flex flex-col items-center">
        <span
          className={cn(
            "text-sm font-black italic transition-colors",
            isAtLimit ? "text-primary-text" : ""
          )}
        >
          {itemCount}
        </span>
      </div>

      {/* PLUS */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-all bg-card/60 hover:text-primary-text",
          isAtLimit ? "opacity-30 cursor-not-allowed" : ""
        )}
        onClick={handleIncrease}
        aria-label={t("increase")}
        disabled={!isMounted}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default QuantityButtons;
