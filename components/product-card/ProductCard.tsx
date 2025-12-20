"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCartBar from "./ProductCartBar";
import PriceView from "./PriceView";
import { Star } from "lucide-react";
import { ProductType } from "@/types/product";
import AddToCartButton from "./AddToCartButton";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductType;
  categoryName: string;
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const isStock = product.stock !== 0;

  return (
    <div className="group relative flex flex-col bg-card/20 rounded-[2.5rem] border overflow-hidden transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)]">
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-square overflow-hidden rounded-[2rem]">
        {product?.images?.length > 0 && (
          <Link
            href={`/product/${product.slug}`}
            className="block h-full w-full"
          >
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-transform duration-1000 ease-out",
                isStock && "group-hover:scale-110"
              )}
            />
          </Link>
        )}

        {/* OUT OF STOCK OVERLAY */}
        {!isStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
            <span className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none border-y border-white/20 py-4">
              Sold Out
            </span>
          </div>
        )}

        {/* LUXURY STATUS BADGE */}
        {product.status && isStock && (
          <div
            style={{ backgroundColor: product.status.color || "" }}
            className="absolute top-4 left-4 px-4 py-1.5 rounded-full shadow-lg"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {product.status.name}
            </span>
          </div>
        )}

        {/* FLOATING ACTION BAR */}
        {isStock && (
          <div className="absolute bottom-6 left-0 w-full translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <ProductCartBar product={product} />
          </div>
        )}
      </div>

      {/* CONTENT INFO */}
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">
            {categoryName}
          </span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < 4 ? "fill-primary text-primary" : "text-zinc-200"
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xl tracking-tighter line-clamp-1 italic uppercase">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">
            Weight: {product.weight}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-black/5 dark:border-white/5 pt-4">
          <PriceView
            price={product.price}
            discount={product.promoPrice ?? undefined}
            className="text-2xl font-black italic tracking-tighter"
          />
        </div>

        <div className="mt-2">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
