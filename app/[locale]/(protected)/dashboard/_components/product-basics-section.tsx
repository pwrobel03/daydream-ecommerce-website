"use client";

import { useTranslations } from "next-intl";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StatusOption } from "@/lib/db-inventory";
import type { ProductSectionProps } from "./product-form-types";

export function ProductBasicsSection({
  form,
  loading,
  statuses,
}: ProductSectionProps & { statuses: StatusOption[] }) {
  const t = useTranslations("dashboard");

  return (
  <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
    <h2 className="text-lg font-semibold leading-[1.35]">
      {t("product.basics")}
    </h2>

    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.name")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={loading}
                className="rounded-md"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.slug")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                className="cursor-not-allowed bg-muted"
                readOnly
                onClick={(e) => {
                  e.preventDefault();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="weight"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.weight")}
            </FormLabel>
            <FormControl>
              <Input
                disabled={loading}
                {...field}
                value={field.value ?? ""}
                placeholder={t("product.weightPlaceholder")}
                autoComplete="off"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="statusId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {t("product.status")}
            </FormLabel>
            <Select
              disabled={loading}
              onValueChange={field.onChange}
              defaultValue={field.value ?? ""}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("product.status")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem disabled={loading} value="none">
                  {t("product.noStatus")}
                </SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            {t("product.description")}
          </FormLabel>
          <FormControl>
            <Textarea
              disabled={loading}
              {...field}
              value={field.value ?? ""}
              className="min-h-30"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  );
}
