"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import GiveInNotice from "./give-in-notice";
import type { ProductImages } from "./use-product-form";

export function ProductImagesSection({
  loading,
  images,
}: {
  loading: boolean;
  images: ProductImages;
}) {
  const t = useTranslations("dashboard");
  const {
    existingImages,
    previews,
    handleFileChange,
    removeExistingImage,
    removeNewImage,
  } = images;

  return (
    <>
  <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
    <div className="flex flex-row flex-wrap items-center justify-between gap-4">
      <h2 className="text-lg font-semibold leading-[1.35]">
        {t("product.images")}
      </h2>
      <Button asChild variant="outline" size="sm" aria-disabled={loading}>
        <label className="cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
          {t("product.upload")}
          <input
            disabled={loading}
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </Button>
    </div>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
            aria-label={t("product.removeImage")}
            className="absolute right-2 top-2 rounded-full border bg-background p-1.5 text-destructive"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {previews.map((url, idx) => (
        <div
          key={idx}
          className="relative aspect-square rounded-md overflow-hidden border-primary border"
        >
          <Image src={url} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => removeNewImage(idx)}
            aria-label={t("product.removeImage")}
            className="absolute right-2 top-2 rounded-full border bg-background p-1.5 text-destructive"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
  <GiveInNotice note={t("product.imageHint")} />
    </>
  );
}
