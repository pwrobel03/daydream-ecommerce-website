import React from "react";
import { HiMinus, HiPlus } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ProductType } from "@/types/product";

interface Props {
  product: ProductType;
  className?: string;
  borderStyle?: string;
}

const QuantityButtons = ({ product, className, borderStyle }: Props) => {
  // const { addItem, removeItem, getItemCount } = undefined;
  // const itemCount = getItemCount(product?.id);
  const isOutOfStock = product?.stock === 0;
  const itemCount = 5;
  const addItem = () => {};
  const removeItem = () => {};

  const handleRemoveProduct = () => {
    // removeItem(product?.id);
    if (itemCount > 1) {
      toast.success("Quantity Decreased successfully!");
    } else {
      toast.success(`${product?.name?.substring(0, 12)} removed successfully!`);
    }
  };
  return (
    <div
      className={twMerge(
        "flex items-center gap-1 pb-1 text-base",
        borderStyle,
        className
      )}
    >
      <Button
        variant="outline"
        size="icon"
        className="w-6 h-6"
        onClick={handleRemoveProduct}
        // disabled={itemCount === 0 || isOutOfStock}
      >
        <HiMinus />
      </Button>
      <span className="font-semibold w-8 text-center text-darkBlue">
        {itemCount}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="w-6 h-6"
        onClick={() => {
          // addItem(product);
          toast.success("Quantity increased successfully!");
        }}
        disabled={isOutOfStock}
      >
        <HiPlus />
      </Button>
    </div>
  );
};

export default QuantityButtons;
