"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/schemas";
import { createCategory } from "@/actions/admin/categories";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryListItem } from "@/lib/db-inventory";
import * as z from "zod";

type CategoryFormInput = z.input<typeof categorySchema>;
type CategoryFormValues = z.output<typeof categorySchema>;

export function CategoryForm({
  parentCategories,
}: {
  parentCategories: Pick<CategoryListItem, "id" | "name">[];
}) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // categorySchema używa .default() dla isSubcategory, więc typ wejściowy
  // różni się od wyjściowego — stąd oba parametry generyczne.
  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      isSubcategory: false,
      parentId: "",
    },
  });

  const isSub = form.watch("isSubcategory");

  async function onSubmit(values: CategoryFormValues) {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");

      if (values.isSubcategory && values.parentId) {
        formData.append("parentId", values.parentId);
      }

      if (values.image?.[0]) {
        formData.append("image", values.image[0]);
      }

      const res = await createCategory(formData);

      if (!res.ok) {
        toast.error(res.message);
      } else {
        toast.success(t("feedback.categoryCreated"));

        // 1. Resetowanie pól tekstowych i checkboxów
        form.reset();

        // 2. Ręczne czyszczenie inputa typu file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // 3. Wymuszenie odświeżenia Server Componentu (strony page.tsx)
        router.refresh();
      }
    } catch {
      toast.error(t("feedback.connectionError"), {
        description: t("feedback.uploadFailed"),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-lg border bg-card p-6"
      >
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("categories.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("categories.namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>{t("categories.image")}</FormLabel>
            <FormControl>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) => form.setValue("image", e.target.files)}
              />
            </FormControl>
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("categories.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("placeholders.categoryStory")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 rounded-lg border bg-muted p-4">
          <FormField
            control={form.control}
            name="isSubcategory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t("categories.isSubcategory")}</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {isSub && (
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categories.parent")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("placeholders.selectParent")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
        <Button
          type="submit"
          disabled={loading || !!readOnlyReason}
          title={readOnlyReason}
        >
          {loading ? t("categories.creating") : t("categories.create")}
        </Button>
      </form>
    </Form>
  );
}
