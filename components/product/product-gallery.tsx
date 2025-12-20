"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils"; // Zakładam, że masz utility cn z shadcn/ui

// Definicja typu zdjęcia zgodna z Prismą
interface ProductImageType {
  id: string;
  url: string;
}

interface ProductGalleryProps {
  images: ProductImageType[];
}

const ProductGallery = ({ images }: ProductGalleryProps) => {
  // Stan przechowujący URL aktualnie wyświetlanego głównego zdjęcia.
  // Na start ustawiamy pierwsze zdjęcie z listy.
  const [mainImage, setMainImage] = useState<string>(images[0]?.url);

  // Zabezpieczenie na wypadek braku zdjęć (choć seed o to dba)
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full flex items-center justify-center bg-secondary/30 rounded-xl">
        <p className="text-muted-foreground">Brak zdjęć produktu</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* --- GŁÓWNE ZDJĘCIE --- */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-white">
        {/* Używamy key={mainImage}, aby wymusić animację przy zmianie zdjęcia */}
        <Image
          key={mainImage}
          src={mainImage}
          alt="Zdjęcie produktu"
          fill
          className="object-contain object-center animate-in fade-in duration-300"
          priority // Ważne dla SEO i LCP (Largest Contentful Paint)
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* --- MINIATURKI (Thumbnails) --- */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image) => {
            const isActive = mainImage === image.url;
            return (
              <button
                key={image.id}
                onClick={() => setMainImage(image.url)}
                className={cn(
                  "relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  isActive
                    ? "border-primary ring-2 ring-primary/30" // Aktywna miniaturka
                    : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100" // Nieaktywna
                )}
              >
                <Image
                  src={image.url}
                  alt="Miniaturka produktu"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
