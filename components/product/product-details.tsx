// components/product/product-details.tsx
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProductDetail } from "@/lib/db-products";

export default function ProductDetails({ product }: { product: ProductDetail }) {
  const t = useTranslations("product");

  return (
    <div className="grid gap-12 py-16 md:py-24 lg:grid-cols-2">
      {product.description && (
        <section className="flex max-w-[65ch] flex-col gap-4">
          <h2 className="font-display text-2xl leading-[1.2] text-balance">
            {t("description")}
          </h2>
          <p className="whitespace-pre-line break-words text-pretty">
            {product.description}
          </p>
        </section>
      )}

      {product.ingredients.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl leading-[1.2] text-balance">
            {t("ingredients")}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
            {product.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center"
              >
                {ing.image && (
                  <Image
                    src={ing.image}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 object-contain"
                  />
                )}
                <span className="break-words text-sm font-medium">{ing.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
