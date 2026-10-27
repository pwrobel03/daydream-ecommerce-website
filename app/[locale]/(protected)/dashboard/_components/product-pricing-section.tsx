"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import type { ProductSectionProps } from "./product-form-types";

export function ProductPricingSection({ form, loading }: ProductSectionProps) {
  const t = useTranslations("dashboard");

  return (
  <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
    <h2 className="text-lg font-semibold leading-[1.35]">
      {t("product.pricing")}
    </h2>
    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.priceLabel")}
            </FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                {...field}
                className="tabular-nums"
                placeholder={t("product.pricePlaceholder")}
                autoComplete="off"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="promoPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.promoPrice")}
            </FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                {...field}
                value={field.value ?? ""}
                className="tabular-nums"
                placeholder={t("product.promoPlaceholder")}
                autoComplete="off"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
    <FormField
      control={form.control}
      name="stock"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            {t("product.stockLabel")}
          </FormLabel>
          <FormControl>
            <Input
              disabled={loading}
              type="number"
              {...field}
              value={field.value as number}
              className="tabular-nums"
              min={0}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  );
}
