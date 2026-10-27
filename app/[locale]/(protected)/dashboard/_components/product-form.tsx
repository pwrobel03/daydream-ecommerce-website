"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type {
  IngredientOption,
  MainCategoryWithChildren,
  ProductFormData,
  StatusOption,
} from "@/lib/db-inventory";
import { useProductForm } from "./use-product-form";
import { ProductBasicsSection } from "./product-basics-section";
import { ProductImagesSection } from "./product-images-section";
import { ProductPricingSection } from "./product-pricing-section";
import { ProductTaxonomySection } from "./product-taxonomy-section";

interface ProductFormProps {
  initialData: ProductFormData | null;
  categories: MainCategoryWithChildren[];
  ingredients: IngredientOption[];
  statuses: StatusOption[];
}

export function ProductForm({
  initialData,
  categories = [],
  ingredients = [],
  statuses = [],
}: ProductFormProps) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const { form, loading, images, onSubmit } = useProductForm(initialData);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <div className="flex flex-col gap-6 lg:col-span-7">
          <ProductBasicsSection form={form} loading={loading} statuses={statuses} />
          <ProductImagesSection loading={loading} images={images} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <ProductPricingSection form={form} loading={loading} />
          <ProductTaxonomySection
            form={form}
            loading={loading}
            categories={categories}
            ingredients={ingredients}
          />

          {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
          <Button
            type="submit"
            size="lg"
            disabled={loading || !!readOnlyReason}
            title={readOnlyReason}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : initialData ? (
              t("product.save")
            ) : (
              t("product.create")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
