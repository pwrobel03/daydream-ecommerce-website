"use client";

import React from "react";
import { HiMinus, HiPlus } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ProductType } from "@/types/product";
import { useCart } from "@/hooks/use-cart";

interface Props {
  product: ProductType;
  className?: string;
  borderStyle?: string;
}

const QuantityButtons = ({ product, className, borderStyle }: Props) => {
  const { addItem, removeItem, getItemCount, isMounted } = useCart();

  const itemCount = isMounted ? getItemCount(product?.id) : 0;
  const stockLimit = product?.stock ?? 0;
  const isAtLimit = itemCount >= stockLimit;

  const handleIncrease = () => {
    // KLUCZOWA ZMIANA: Zamiast disabled w buttonie, obsługujemy limit tutaj
    if (isAtLimit) {
      toast.error(`Limit reached: Only ${stockLimit} units available`, {
        description: "We don't have more of this item in our daydream storage.",
        duration: 2000,
      });
      return;
    }

    addItem(product);
    toast.success("Quantity increased!");
  };

  const handleDecrease = () => {
    if (itemCount === 0) return;

    removeItem(product?.id);
    if (itemCount > 1) {
      toast.success("Quantity decreased");
    } else {
      toast.success("Removed from cart");
    }
  };

  return (
    <div className={twMerge("flex items-center gap-1", borderStyle, className)}>
      {isAtLimit && (
        <span className="text-[8px] uppercase font-bold text-destructive flex justify-center items-center">
          Limit reached
        </span>
      )}
      {/* PRZYCISK MINUS */}
      <Button
        variant="outline"
        size="icon"
        className="w-6 h-6"
        onClick={handleDecrease}
        disabled={itemCount === 0 || !isMounted}
      >
        <HiMinus className="w-3 h-3" />
      </Button>

      {/* LICZNIK */}
      <div className="flex flex-col items-center min-w-8 select-none">
        <span
          className={twMerge(
            "font-bold text-sm leading-none transition-colors",
            isAtLimit ? "text-destructive" : "text-foreground"
          )}
        >
          {itemCount}
        </span>
      </div>

      {/* PRZYCISK PLUS (Zmieniony) */}
      <Button
        variant="outline"
        size="icon"
        // Nie używamy atrybutu 'disabled', aby onClick mógł odpalić toast
        className={twMerge(
          "w-6 h-6 transition-all",
          isAtLimit &&
            "opacity-50 cursor-not-allowed bg-secondary/50 border-destructive"
        )}
        onClick={handleIncrease}
        disabled={!isMounted} // Wyłączony tylko gdy system nie jest gotowy
      >
        <HiPlus
          className={twMerge("w-3 h-3", isAtLimit && "text-destructive")}
        />
      </Button>
    </div>
  );
};

export default QuantityButtons;
