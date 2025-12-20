// components/product/product-hero.tsx
"use client";

import { useCart } from "@/hooks/use-cart";
import { ArrowRight } from "lucide-react";
import SubTitle from "@/components/sub-title";
import PriceFormatter from "../product-card/PriceFormatter";

export default function ProductHero({ product }: { product: any }) {
  const { addItem } = useCart();

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-4 mb-4">
          {product.status && (
            <span className="font-black tracking-[0.4em] uppercase py-2 px-4 rounded-full bg-foreground text-background">
              {product.status.name}
            </span>
          )}
        </div>
        <SubTitle text={product.name} />
      </header>

      <div className="flex items-center gap-6">
        <div className="text-5xl font-black tracking-tighter">
          {product.promoPrice ? (
            <PriceFormatter amount={product.promoPrice} />
          ) : (
            <PriceFormatter amount={product.price} />
          )}
        </div>
        {product.promoPrice && (
          <span className="text-xl line-through opacity-30 font-light">
            <PriceFormatter amount={product.price} />
          </span>
        )}
      </div>
      <div className="pt-10">
        <button
          onClick={() => addItem(product)}
          className="group relative w-full h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="relative z-10 flex items-center justify-center gap-4 text-xl font-black uppercase italic tracking-tighter">
            <span>Grab this dream</span>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
