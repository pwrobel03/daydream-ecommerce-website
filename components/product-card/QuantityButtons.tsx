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
  const tq = useTranslations("addToCart");
  const maxUnits = Math.min(MAX_UNITS_PER_LINE, product?.stock ?? 0);
  const isAtLimit = itemCount >= maxUnits;

  const handleIncrease = () => {
    if (isAtLimit) {
      toast.error(t("quantityLimit", { max: maxUnits }));
      return;
    }
    toast.success(tq("increased"));
    addItem(product);
  };

  return (
    <div className="flex items-center rounded-md border p-0.5">
      {/* MINUS */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={tq("decrease")}
        onClick={() => {
          removeItem(product.id);
          toast.success(tq("decreased"));
        }}
        aria-label={t("decrease")}
        disabled={itemCount === 0 || !isMounted}
      >
        <Minus />
      </Button>

      {/* LICZNIK */}
      <span
        className={cn(
          "min-w-8 text-center text-sm font-medium tabular-nums",
          isAtLimit && "text-primary-text"
        )}
      >
        {itemCount}
      </span>

      {/* PLUS */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={tq("increase")}
        className={cn(isAtLimit && "opacity-50")}
        onClick={handleIncrease}
        aria-label={t("increase")}
        disabled={!isMounted}
      >
        <Plus />
      </Button>
    </div>
  );
};

export default QuantityButtons;
