"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import type { Category, Ingredient, ProductType, Status } from "@/types/product";
import { useProductForm } from "./use-product-form";
import { ProductBasicsSection } from "./product-basics-section";
import { ProductImagesSection } from "./product-images-section";
import { ProductPricingSection } from "./product-pricing-section";
import { ProductTaxonomySection } from "./product-taxonomy-section";

interface ProductFormProps {
  initialData: ProductType | null;
  categories: Category[];
  ingredients: Ingredient[];
  statuses: Status[];
}

export function ProductForm({
  initialData,
  categories = [],
  ingredients = [],
  statuses = [],
}: ProductFormProps) {
  const t = useTranslations("dashboard");
  const { form, loading, images, onSubmit } = useProductForm(initialData);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
      >
        <div className="lg:col-span-7 space-y-8">
          <ProductBasicsSection form={form} loading={loading} statuses={statuses} />
          <ProductImagesSection loading={loading} images={images} />
        </div>

        <div className="lg:col-span-5 space-y-8">
          <ProductPricingSection form={form} loading={loading} />
          <ProductTaxonomySection
            form={form}
            loading={loading}
            categories={categories}
            ingredients={ingredients}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-24 bg-foreground text-background hover:text-primary-foreground rounded-[2rem] font-black uppercase italic text-xl hover:bg-primary transition-all shadow-2xl"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : initialData ? (
              t("ingredients.confirm")
            ) : (
              t("ingredients.forge")
            )}
          </button>
        </div>
      </form>
    </Form>
  );
}
