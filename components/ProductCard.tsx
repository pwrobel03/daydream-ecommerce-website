// components/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const ProductCard = ({ product }: { product: any }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = product.images;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col gap-5"
      onMouseEnter={() => images.length > 1 && setCurrentImage(1)}
      onMouseLeave={() => setCurrentImage(0)}
    >
      {/* KONTENER ZDJĘCIA */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-accent/10 border border-border/50">
        {images.length > 0 ? (
          <Image
            src={images[currentImage]?.url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs uppercase font-bold text-muted-foreground">
            No image available
          </div>
        )}

        {/* CENA I WAGA (Solid Badge) */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <div className="bg-background px-4 py-2 rounded-2xl shadow-xl border border-border">
            <span className="text-lg font-black italic tracking-tighter">
              {Number(product.price).toFixed(2)} PLN
            </span>
          </div>
          <div className="bg-secondary/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
              {product.weight}
            </span>
          </div>
        </div>
      </div>

      {/* INFO O PRODUKCIE */}
      <div className="px-2">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* SKŁADNIKI (Małe ikony) */}
        <div className="flex gap-2 mt-4">
          {product.ingredients.slice(0, 3).map((ing: any) => (
            <div
              key={ing.id}
              className="w-8 h-8 rounded-full bg-accent/20 border border-border/50 p-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
              title={ing.name}
            >
              {ing.image && (
                <img
                  src={ing.image}
                  alt={ing.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
          {product.ingredients.length > 3 && (
            <span className="text-[10px] font-bold text-muted-foreground flex items-center">
              +{product.ingredients.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
