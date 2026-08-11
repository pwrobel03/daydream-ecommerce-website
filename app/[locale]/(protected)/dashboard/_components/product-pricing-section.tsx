"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ProductSectionProps } from "./product-form-types";

export function ProductPricingSection({ form, loading }: ProductSectionProps) {
  return (
  <div className="p-10 rounded-[2rem] shadow-2xl space-y-6 bg-card/60">
    <h2 className="text-xl font-black italic uppercase tracking-tight text-primary-text">
      Economics
    </h2>
    <div className="grid grid-cols-1 gap-6">
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
              Price
            </FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                {...field}
                className="rounded-md h-12 capitalize font-black"
                placeholder="set default price"
                autoComplete="off"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="promoPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
              Promo
            </FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                {...field}
                value={field.value ?? ""}
                className="rounded-md h-12 capitalize font-black"
                placeholder="promo price"
                autoComplete="off"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
    <FormField
      control={form.control}
      name="stock"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
            Inventory Stock
          </FormLabel>
          <FormControl>
            <Input
              disabled={loading}
              type="number"
              {...field}
              value={field.value as number}
              className="rounded-md text-sm font-black italic"
              min={0}
            />
          </FormControl>
        </FormItem>
      )}
    />
  </div>
  );
}
