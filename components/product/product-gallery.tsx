"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ProductStatusBadge from "../product-status-badge";

export default function ProductGallery({
  images,
  status,
}: {
  images: any[];
  status: any;
}) {
  const [active, setActive] = useState(images[0]?.url);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full flex flex-col items-center group">
      {/* 1. KONTENER ZDJĘCIA */}
      <div className="relative w-full aspect-square lg:aspect-square overflow-hidden rounded-[3rem] max-h-180">
        <div className="absolute" />
        <Image
          key={active}
          src={active}
          alt="Product Display"
          fill
          priority
          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        />
      </div>

      {/* 2. FLOATING NAV (Bez zmian - działa dobrze z ujemnym marginesem) */}
      <div className="relative z-20 m-10 px-4 w-full flex justify-center">
        <div className="flex gap-3 p-2.5 rounded-full bg-card/50 absolute bottom-20">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img.url)}
              className={cn(
                "relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 transition-all duration-500",
                active === img.url
                  ? "border-primary scale-110 shadow-inner"
                  : "border-transparent opacity-40 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt="thumbnail"
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 3. STATUS BADGE (Bez zmian) */}
      {status && (
        <div className="absolute top-6 left-6 z-10">
          <ProductStatusBadge
            name={status.name}
            color={status.color}
            className="px-8 py-5 text-xl opacity-80"
          />
        </div>
      )}
    </div>
  );
}
