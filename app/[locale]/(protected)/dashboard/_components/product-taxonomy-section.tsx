"use client";

import { Layers, Beaker } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Category, Ingredient } from "@/types/product";
import type { ProductSectionProps } from "./product-form-types";

export function ProductTaxonomySection({
  form,
  loading,
  categories,
  ingredients,
}: ProductSectionProps & {
  categories: Category[];
  ingredients: Ingredient[];
}) {
  return (
  <div className="bg-card/60 p-10 rounded-[2rem] border space-y-8">
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-primary" />
        <h3 className="font-black uppercase italic text-sm">
          Taxonomy
        </h3>
      </div>
      <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-input/40 cursor-pointer"
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
              // Stylizujemy tło przez klasę:
              className="border data-[state=checked]:bg-primary data-[state=checked]:text-white"
            />
            <label
              htmlFor={cat.id}
              className="text-xs font-black uppercase tracking-widest cursor-pointer select-none"
            >
              {cat.name}
            </label>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Beaker size={16} className="text-primary" />
        <h3 className="font-black uppercase italic text-sm">
          Ingredients
        </h3>
      </div>
      <div className="flex flex-wrap gap-2 overflow-y-auto max-h-60">
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
              "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
              form.watch("ingredientIds")?.includes(ing.id)
                ? "bg-primary text-white"
                : "bg-input/50"
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
