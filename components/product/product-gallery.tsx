"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import ProductStatusBadge from "../product-status-badge";
import type { ProductDetail } from "@/lib/db-products";

export default function ProductGallery({
  name,
  images,
  status,
}: {
  name: string;
  images: ProductDetail["images"];
  status: ProductDetail["status"];
}) {
  const t = useTranslations("product");
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
        <Image
          key={images[activeIndex].url}
          src={images[activeIndex].url}
          alt={t("galleryImage", {
            name,
            index: activeIndex + 1,
            total: images.length,
          })}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
        {status && (
          <div className="absolute left-3 top-3 z-10">
            <ProductStatusBadge name={status.name} color={status.color ?? ""} />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={t("showImage", { index: i + 1 })}
              aria-pressed={i === activeIndex}
              className={cn(
                "relative size-16 overflow-hidden rounded-md border-2 transition-opacity",
                i === activeIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
