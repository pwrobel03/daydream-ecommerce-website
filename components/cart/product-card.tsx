import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import PriceFormatter from "@/components/PriceFormatter";
import QuantityButtons from "@/components/product-card/QuantityButtons";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/store";
import Image from "next/image";

interface CartItemProps {
  item: CartItem;
  stock: number;
  isOutOfStock: boolean;
  isOverLimit: boolean;
  deleteCartProduct: (id: string) => void;
}

const ProductCard = ({
  item,
  stock,
  isOutOfStock,
  isOverLimit,
  deleteCartProduct,
}: CartItemProps) => {
  const t = useTranslations("cart");
  const hasProblem = isOutOfStock || isOverLimit;

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border bg-card p-4 md:gap-6 md:p-6",
        hasProblem && "border-destructive"
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted md:size-28">
        {item.product.images?.[0]?.url ? (
          <Image
            src={item.product.images[0].url}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon size={20} aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="min-w-0 space-y-3">
          <h3 className="line-clamp-2 break-words text-base font-medium leading-[1.4]">
            {item.product.name}
          </h3>

          {hasProblem ? (
            <p
              role="alert"
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {isOutOfStock ? t("outOfStock") : t("overLimit", { stock })}
            </p>
          ) : (
            <div className="flex items-baseline gap-3 text-sm tabular-nums">
              <PriceFormatter
                amount={Number(item.product.promoPrice ?? item.product.price)}
              />
              {item.product.promoPrice && (
                <span className="text-muted-foreground line-through">
                  <PriceFormatter
                    className="font-normal text-muted-foreground"
                    amount={Number(item.product.price)}
                  />
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <QuantityButtons product={item.product} />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label={t("remove", { name: item.product.name })}
              onClick={() => deleteCartProduct(item.product.id)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 text-lg font-semibold tabular-nums sm:min-w-24 sm:text-right",
            isOutOfStock && "text-muted-foreground line-through"
          )}
        >
          <PriceFormatter
            className={cn(
              "sm:justify-end",
              isOutOfStock && "font-normal text-muted-foreground"
            )}
            amount={
              Number(item.product.promoPrice ?? item.product.price) *
              item.quantity
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
