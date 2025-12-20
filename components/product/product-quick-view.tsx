"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProductType } from "@/types/product";
import ProductGallery from "./product-gallery";
import ProductDetails from "./product-details";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@/components/ui/dialog";

interface ProductQuickViewProps {
  product: ProductType;
  children: React.ReactNode;
}

export function ProductQuickView({ product, children }: ProductQuickViewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] md:max-w-5xl p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl">
        {/* Dostępność: Tytuł dla czytników ekranu (niewidoczny) */}
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden>

        <div className="grid grid-cols-1 h-full max-h-[90vh] overflow-y-auto">
          {/* LEWA: Galeria (z mniejszym paddingiem) */}
          <div className="flex items-center justify-center">
            <ProductGallery images={product.images} status={null} />
          </div>

          {/* PRAWA: Detale */}
          <div className="px-4 flex flex-col justify-center">
            <ProductDetails product={product} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
