// components/product/product-hero.tsx
"use client";

import SubTitle from "@/components/sub-title";
import PriceFormatter from "../PriceFormatter";
import AddToCartButton from "../product-card/AddToCartButton";
import type { ProductDetail } from "@/lib/db-products";
import { toCartProduct } from "@/store";

export default function ProductHero({ product }: { product: ProductDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <SubTitle text={product.name} className="mb-0 break-words" />

      <div className="flex items-baseline gap-4 tabular-nums">
        <PriceFormatter
          amount={Number(product.promoPrice ?? product.price)}
          className="text-3xl"
        />
        {product.promoPrice && (
          <PriceFormatter
            amount={Number(product.price)}
            className="text-lg font-normal text-muted-foreground line-through"
          />
        )}
      </div>

      <AddToCartButton product={toCartProduct(product)} />
    </div>
  );
}
