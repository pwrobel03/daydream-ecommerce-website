"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import PriceView from "./PriceView";
import { Star } from "lucide-react";
import { ProductType } from "@/types/product";
import AddToCartButton from "./AddToCartButton";
import { cn } from "@/lib/utils";
import ProductStatusBadge from "@/components/product-status-badge";

interface ProductCardProps {
  product: ProductType;
  // categoryName zostawiamy jako fallback, ale priorytet mają kategorie z obiektu
  categoryName?: string;
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const isStock = product.stock !== 0;

  // Obliczamy średnią ocen z recenzji, które dodaliśmy skryptem seed
  const reviews = product.reviews || [];
  const averageRating =
    reviews.length > 0
      ? Math.round(
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        )
      : 0;

  // Wybieramy kategorie do wyświetlenia (np. pierwsze dwie)
  const displayCategories =
    product.categories && product.categories.length > 0
      ? product.categories.map((c) => c.name).join(" / ")
      : categoryName;

  return (
    <div className="group relative flex flex-col rounded-[2.5rem] border overflow-hidden transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] bg-card/60 backdrop-blur-sm">
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border-b bg-zinc-100 dark:bg-zinc-900">
        {product?.images && product.images.length > 0 && (
          <Link
            href={`/product/${product.slug}`}
            className="relative block h-full w-full"
          >
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={cn(
                "object-cover transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isStock && "group-hover:scale-110"
              )}
            />
          </Link>
        )}

        {/* OUT OF STOCK OVERLAY */}
        {!isStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-6 text-center z-20">
            <span className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none border-y-2 border-white/20 py-6 w-full">
              Sold Out
            </span>
          </div>
        )}

        {/* LUXURY STATUS BADGE */}
        {product.status && isStock && (
          <div className="absolute top-6 left-6 z-10 transition-transform group-hover:-translate-y-1">
            <ProductStatusBadge
              name={product.status.name}
              color={product.status.color || ""}
            />
          </div>
        )}
      </div>

      {/* CONTENT INFO */}
      <div className="p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic truncate max-w-[70%]">
            {displayCategories}
          </span>

          {/* OCENA PRODUKTU (DYNAMICZNA) */}
          <div className="flex items-center gap-1">
            <Star
              className={cn(
                "w-3 h-3",
                averageRating > 0
                  ? "fill-primary text-primary"
                  : "text-zinc-300"
              )}
            />
            <span className="text-[10px] font-black italic tracking-tighter opacity-40">
              {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-black text-2xl md:text-3xl tracking-tighter line-clamp-1 italic uppercase leading-none">
            {product.name}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              Units: {product.weight}
            </p>
            <div className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              Stock: {product.stock}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-black/5 dark:border-white/5 pt-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-1 italic">
              Price Registry
            </span>
            <PriceView
              price={Number(product.price)}
              discount={product.promoPrice != null ? Number(product.promoPrice) : undefined}
              className="text-3xl font-black italic tracking-tighter leading-none"
            />
          </div>
        </div>

        <div className="mt-2 transition-transform duration-500 group-hover:translate-y-[-4px]">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
