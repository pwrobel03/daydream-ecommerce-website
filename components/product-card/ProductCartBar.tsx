"use client";

import { Heart, Eye, ArrowLeftRight, ShoppingBag } from "lucide-react";
import { ProductType } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductCartBarProps {
  product: ProductType;
}

const ProductCartBar = ({ product }: ProductCartBarProps) => {
  const actions = [
    { icon: Heart, label: "Wishlist" },
    { icon: Eye, label: "Quick View" },
    { icon: ArrowLeftRight, label: "Compare" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {actions.map((action, i) => (
        <button
          key={i}
          className="group/btn relative h-11 w-11 flex items-center justify-center bg-background/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full shadow-xl hover:bg-primary hover:text-white transition-all duration-500"
        >
          <action.icon className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
          {/* Tooltip */}
          <span className="absolute -top-10 scale-0 group-hover/btn:scale-100 transition-all duration-300 px-2 py-1 bg-black/50 text-white text-[10px] font-black uppercase tracking-widest rounded-md">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ProductCartBar;
