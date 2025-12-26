"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ProductType } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const QuantityButtons = ({ product }: { product: ProductType }) => {
  const { addItem, removeItem, getItemCount, isMounted } = useCart();
  const itemCount = isMounted ? getItemCount(product?.id) : 0;
  const isAtLimit = itemCount >= (product?.stock ?? 0);

  const handleIncrease = () => {
    if (isAtLimit) {
      toast.error("Daydream Storage Limit Reached", {
        description: "We're holding the last units for you.",
      });
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
        className="h-8 w-8 rounded-full hover:bg-card hover:shadow-sm transition-all hover:text-primary"
        onClick={() => {
          removeItem(product.id);
          toast.success("Quantity decreased");
        }}
        disabled={itemCount === 0 || !isMounted}
      >
        <Minus className="w-3 h-3" />
      </Button>

      {/* LICZNIK */}
      <div className="px-3 min-w-[2.5rem] flex flex-col items-center">
        <span
          className={cn(
            "text-sm font-black italic transition-colors",
            isAtLimit ? "text-primary" : ""
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
          "h-8 w-8 rounded-full transition-all bg-card hover:text-primary",
          isAtLimit ? "opacity-30 cursor-not-allowed" : ""
        )}
        onClick={handleIncrease}
        disabled={!isMounted}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default QuantityButtons;
