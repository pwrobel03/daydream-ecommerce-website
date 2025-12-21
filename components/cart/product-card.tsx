import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, BadgeAlert, Car, Trash2 } from "lucide-react";
import PriceFormatter from "@/components/PriceFormatter";
import QuantityButtons from "@/components/product-card/QuantityButtons";
import { CartItem } from "@/store";

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
  return (
    <div
      key={item.product.id}
      className={cn(
        "group relative flex flex-row items-center gap-4 p-4 md:gap-8 md:p-8 rounded-[1.5rem] border transition-all duration-500 bg-card/60",
        (isOutOfStock || isOverLimit) && "border-destructive bg-destructive/25"
      )}
    >
      {/* Image Placeholder */}
      <div className="relative w-16 h-32 md:w-40 md:h-40 bg-zinc-100 md:rounded-[1rem] overflow-hidden flex-shrink-0 grayscale">
        <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-10">
          IMAGE
        </div>
      </div>
      {/* Content */}
      <div className="w-full flex flex-col xs:flex-row gap-4">
        {/* Details */}
        <div className="flex-grow space-y-4">
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">
            {item.product.name}
          </h3>

          {/* BŁĘDY / WARNINGS */}
          <div className="min-h-[24px]">
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-destructive font-black italic uppercase text-sm tracking-widest">
                <BadgeAlert size={16} /> Out of Stock
              </div>
            ) : isOverLimit ? (
              <div className="flex items-center gap-2 text-destructive font-black italic uppercase text-sm tracking-widest leading-none">
                <AlertTriangle size={16} />
                <p>
                  You can only buy {stock} items. <br />
                  Please reduce quantity.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="text-lg font-black tracking-tighter">
                  {item.product.promoPrice ? (
                    <PriceFormatter amount={item.product.promoPrice} />
                  ) : (
                    <PriceFormatter amount={item.product.price} />
                  )}
                </div>
                {item.product.promoPrice && (
                  <span className="text-md line-through opacity-30 font-light">
                    <PriceFormatter amount={item.product.price} />
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-8">
            {/* UŻYWAMY TWOJEGO KOMPONENTU DO ZMIANY ILOŚCI */}
            <QuantityButtons product={item.product} />

            <button
              onClick={() => deleteCartProduct(item.product.id)}
              className="text-destructive/60 hover:text-destructive p-2 transition-colors scale-100 hover:scale-110 cursor-pointer"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>

        {/* Subtotal */}
        <div className="text-right">
          <div
            className={cn(
              "text-4xl font-black tracking-tighter",
              isOutOfStock ? "line-through opacity-20" : "text-zinc-900"
            )}
          >
            <PriceFormatter
              amount={
                Number(item.product.promoPrice || item.product.price) *
                item.quantity
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
