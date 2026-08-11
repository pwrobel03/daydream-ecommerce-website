"use client";

import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import GiveInNotice from "./give-in-notice";
import type { ProductImages } from "./use-product-form";

export function ProductImagesSection({
  loading,
  images,
}: {
  loading: boolean;
  images: ProductImages;
}) {
  const {
    existingImages,
    previews,
    handleFileChange,
    removeExistingImage,
    removeNewImage,
  } = images;

  return (
    <>
  <div className="bg-card/60 p-10 rounded-[2rem] border">
    <div className="flex justify-between mb-8 flex-row flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <ImageIcon size={18} className="text-primary-text" />
        <h2 className="text-xl font-black italic uppercase tracking-tight">
          Media
        </h2>
      </div>
      <label className="cursor-pointer max-w-40 bg-foreground text-background hover:text-white px-8 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest hover:bg-primary transition-all">
        Upload{" "}
        <input
          disabled={loading}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
    <div className="grid sm:grid-cols-3 md:grid-cols-2 gap-4">
      {existingImages.map((url, idx) => (
        <div
          key={idx}
          className="relative aspect-square rounded-md overflow-hidden border"
        >
          <Image src={url} alt="" fill className="object-cover" />
          <button
            disabled={loading}
            type="button"
            onClick={() => removeExistingImage(url)}
            className="absolute top-2 right-2 bg-white rounded-full p-1 text-destructive/50 shadow-sm"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {previews.map((url, idx) => (
        <div
          key={idx}
          className="relative aspect-square rounded-md overflow-hidden border-primary/20 border"
        >
          <Image src={url} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => removeNewImage(idx)}
            className="absolute top-2 right-2 bg-white rounded-full p-1 text-destructive/50 shadow-sm"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
  <GiveInNotice note="Note: The recommended image resolution is up to 2048x2048 pixels. Photos with square aspect ratio will look the best." />
    </>
  );
}
