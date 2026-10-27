"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type {
  IngredientOption,
  MainCategoryWithChildren,
} from "@/lib/db-inventory";
import type { ProductSectionProps } from "./product-form-types";

export function ProductTaxonomySection({
  form,
  loading,
  categories,
  ingredients,
}: ProductSectionProps & {
  categories: MainCategoryWithChildren[];
  ingredients: IngredientOption[];
}) {
  const t = useTranslations("dashboard");

  return (
  <div className="flex flex-col gap-6 rounded-lg border bg-card p-6">
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold leading-[1.35]">
        {t("product.categories")}
      </h2>
      <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 rounded-md p-2 transition-colors duration-150 ease-out hover:bg-accent"
          >
            <Checkbox
              disabled={loading}
              id={cat.id}
              checked={form.watch("categoryIds")?.includes(cat.id)}
              onCheckedChange={(checked) => {
                const current = form.getValues("categoryIds") || [];
                form.setValue(
                  "categoryIds",
                  checked
                    ? [...current, cat.id]
                    : current.filter((id) => id !== cat.id)
                );
              }}
              className="border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor={cat.id}
              className="flex-1 cursor-pointer select-none break-words text-sm"
            >
              {cat.name}
            </label>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold leading-[1.35]">
        {t("product.ingredients")}
      </h2>
      <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
        {ingredients.map((ing) => (
          <button
            type="button"
            disabled={loading}
            key={ing.id}
            onClick={() => {
              const cur = form.getValues("ingredientIds") || [];
              form.setValue(
                "ingredientIds",
                cur.includes(ing.id)
                  ? cur.filter((id) => id !== ing.id)
                  : [...cur, ing.id]
              );
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors duration-150 ease-out",
              form.watch("ingredientIds")?.includes(ing.id)
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            )}
          >
            {ing.name}
          </button>
        ))}
      </div>
    </div>
  </div>
  );
}
