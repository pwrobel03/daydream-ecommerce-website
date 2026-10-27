"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import PriceView from "./PriceView";
import { Star } from "lucide-react";
import type { ProductCardData } from "@/lib/db-products";
import AddToCartButton from "./AddToCartButton";
import { toCartProduct } from "@/store";
import { useTranslations } from "next-intl";
import ProductStatusBadge from "@/components/product-status-badge";

interface ProductCardProps {
  product: ProductCardData;
  // categoryName zostawiamy jako fallback, ale priorytet mają kategorie z obiektu
  categoryName?: string;
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const t = useTranslations("catalogue");
  const isStock = product.stock !== 0;

  // Średnia pochodzi z agregatu w bazie, nie z opinii doładowanych do widoku —
  // te ostatnie były tylko podzbiorem, więc gwiazdki pokazywały ocenę
  // ostatnich kilku opinii zamiast wszystkich.
  const averageRating = Math.round(product.ratingAvg);

  // Wybieramy kategorie do wyświetlenia (np. pierwsze dwie)
  const displayCategories =
    product.categories && product.categories.length > 0
      ? product.categories.map((c) => c.name).join(" / ")
      : categoryName;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-square overflow-hidden border-b bg-muted">
        {product?.images && product.images.length > 0 && (
          <Link
            href={`/product/${product.slug}`}
            aria-hidden
            tabIndex={-1}
            className="relative block h-full w-full"
          >
            <Image
              src={product.images[0].url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </Link>
        )}

        {(!isStock || product.status) && (
          <div className="absolute left-3 top-3 z-10">
            <ProductStatusBadge name={isStock ? product.status!.name : t("soldOut")} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="truncate">{displayCategories}</span>
            {averageRating > 0 && (
              <span className="flex shrink-0 items-center gap-1 tabular-nums">
                <Star className="size-3.5 fill-primary text-primary-text" aria-hidden />
                {averageRating.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 break-words text-base font-medium leading-[1.4]">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>

          <p className="text-sm text-muted-foreground tabular-nums">
            {[product.weight, isStock && t("inStock", { count: product.stock })]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <PriceView
            price={Number(product.price)}
            discount={product.promoPrice != null ? Number(product.promoPrice) : undefined}
            className="text-xl font-semibold"
          />
          <AddToCartButton product={toCartProduct(product)} />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
