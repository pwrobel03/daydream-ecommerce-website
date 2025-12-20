"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCartBar from "./ProductCartBar";
import PriceView from "./PriceView";
import { is } from "zod/v4/locales";
import { LuStar } from "react-icons/lu";
import { ProductType } from "./ProductCartBar";

interface ProductCardProps {
  product: ProductType;
}

const ProductCard = ({ product }: ProductCardProps) => {
  // product.stock = 0;
  const isStock = product.stock !== 0;
  product.status = "New";
  product.promoPrice = 12.3;

  return (
    <div className="border border-border rounded-lg overflow-hidden group text-sm">
      <div className="overflow-hidden relative">
        {product?.images?.length > 0 && product.slug && (
          <Link href={`/product/${product.slug}`}>
            <Image
              src={product.images[0].url}
              alt={product.name}
              width={500}
              height={500}
              loading="lazy"
              className={`w-full max-h-96 object-cover overflow-hidden transition-transform duration-500 ${
                product.stock !== 0 && "group-hover:scale-105"
              }`}
            />
          </Link>
        )}
        {/* absolute image cover for prodcuts out of stock */}
        {!isStock && (
          <div>
            <p className="absolute top-0 left-0 w-full h-full text-white px-2 py-2 rounded-t-lg text-3xl font-extrabold bg-black opacity-50 flex items-center justify-center">
              Out of stock
            </p>
          </div>
        )}
        {/* Possible product status now moderate handle */}
        {product.status && isStock && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.status.split("").map((char, index) => (
              <span
                key={index}
                className="font-extrabold text-xl rounded-full capitalize text-center group-hover:opacity-0 transition-opacity duration-300"
              >
                {char}
              </span>
            ))}
          </div>
        )}
        {/* ProductCartBar */}
        {/* Kontener paska - Dedykowana logika zamiast .hoverEffect */}
        {isStock && (
          <div
            className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 group-hover:translate-y-[-10px] transition-all duration-300 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          "
          >
            <ProductCartBar product={product} />
          </div>
        )}
      </div>
      <div className="p-5 bg-border flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p>Snacks</p>
          <div className="text-lightText flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const isLastStar = index === 4;
              return (
                <LuStar
                  fill={!isLastStar ? "var(--ring)" : "transparent"}
                  key={index}
                  className="text-ring"
                />
              );
            })}
          </div>
        </div>
        <p className="font-semibold text-base tracking-wide line-clamp-1 capitalize">
          {product.name}
        </p>
        <div className="flex flex-row justify-between items-center">
          <PriceView
            price={product.price}
            discount={product.promoPrice}
            className="text-primary"
          />
          <p className="semibold">{product.weight}</p>
        </div>
      </div>
      {/* description */}
    </div>
  );
};

export default ProductCard;
