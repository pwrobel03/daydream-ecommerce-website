"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryCard } from "@/lib/db-categories";

export const CategorySection = ({ categories }: { categories: CategoryCard[] }) => {
  const t = useTranslations("home.categories");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <h2 className="font-display text-2xl leading-tight tracking-tight text-balance">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-[65ch] text-pretty text-muted-foreground">
        {t("lead")}
      </p>

      <div className="mt-12 flex h-150 w-full flex-col gap-4 overflow-hidden md:flex-row">
        {categories.map((category, index) => {
          const isActive = activeIndex === index;

          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              aria-label={t("open", { name: category.name })}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              // The expanding panel is the one functional motion: it shows which card is open.
              className={`relative min-h-0 min-w-0 overflow-hidden rounded-lg border bg-card focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-[flex] duration-200 ease-out ${
                isActive ? "flex-[5]" : "flex-[0.4]"
              }`}
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              )}

              {/* Collapsed: the name, read along the strip. */}
              <div
                aria-hidden
                className={`absolute inset-0 z-10 flex items-center justify-center bg-black/60 transition-opacity duration-150 ${
                  isActive ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="max-h-full overflow-hidden px-2 text-lg font-medium text-white md:rotate-180 md:[writing-mode:vertical-lr]">
                  {category.name}
                </span>
              </div>

              {/* Expanded: opaque panel keeps the text readable over any image. */}
              <div
                className={`absolute inset-x-0 bottom-0 z-20 p-4 transition-opacity duration-150 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-display text-2xl leading-tight wrap-anywhere text-foreground">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-2 line-clamp-3 max-w-[40ch] text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
