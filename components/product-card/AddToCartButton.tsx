"use client";

import { CartProduct } from "@/types/product";
import React from "react";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import PriceFormatter from "../PriceFormatter";
import QuantityButtons from "./QuantityButtons";
import { Button } from "../ui/button";
import { useCart } from "@/hooks/use-cart";

const AddToCartButton = ({
  product,
  className,
}: {
  product: CartProduct;
  className?: string;
}) => {
  const t = useTranslations("addToCart");
  const { addItem, getItemCount, isMounted } = useCart();
  const itemCount = isMounted ? getItemCount(product.id) : 0;

  const currentPrice = product.promoPrice
    ? Number(product.promoPrice)
    : Number(product.price);
  const lineSubtotal = currentPrice * itemCount;

  const handleAddToCart = () => {
    addItem(product);
    toast.success(t("added", { name: product.name }));
  };

  return (
    <div className={cn("w-full", className)}>
      {itemCount === 0 ? (
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !isMounted}
          // Solid muted colours instead of fading, so the label keeps 4.5:1 in both themes.
          // Only for sold-out: the brief disabled state before mount must not change colour,
          // or a scan during the transition sees a blend.
          className={cn(
            "w-full disabled:opacity-100",
            product.stock === 0 && "disabled:bg-muted disabled:text-muted-foreground"
          )}
        >
          <ShoppingBag />
          {t("add")}
        </Button>
      ) : (
        <div className="rounded-lg border bg-card p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-primary-text">
              {t("inCart")}
            </span>
            <QuantityButtons product={product} />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2 border-t pt-3">
            <span className="text-sm text-muted-foreground">
              {t("subtotal")}
            </span>

            <div className="flex flex-col items-end tabular-nums">
              {product.promoPrice && (
                <PriceFormatter
                  amount={Number(product.price) * itemCount}
                  className="text-xs font-normal text-muted-foreground line-through"
                />
              )}
              <PriceFormatter
                amount={lineSubtotal}
                className="text-lg font-semibold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
