"use client";
import { ProductType } from "@/types/product";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import PriceFormatter from "./PriceFormatter";
import QuantityButtons from "./QuantityButtons";
interface ProductCardProps {
  product: ProductType;
  className?: string;
}

const AddToCartButton = ({ product, className }: ProductCardProps) => {
  const handleAddToCart = () => {
    toast.success("Product added to cart");
  };
  const itemCount = 5;
  return (
    <div>
      {!itemCount ? (
        <Button
          className={cn(
            "bg-primary/40 border-2 border-primary hover:bg-primary hoverEffect disabled:hover:cursor-not-allowed disabled:bg-primary/20 disabled:border-transparent capitalize"
          )}
          onClick={handleAddToCart}
        >
          <ShoppingCart />
          add to cart
        </Button>
      ) : (
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quantity</span>
            <QuantityButtons product={product} />
          </div>
          <div className="flex items-center justify-between border-t pt-1">
            <span className="text-xs font-semibold">Subtotal</span>
            <PriceFormatter
              amount={product?.price ? product.price * itemCount : 0}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
