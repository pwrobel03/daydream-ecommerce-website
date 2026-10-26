"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { productSchema } from "@/schemas";
import { upsertProduct } from "@/actions/admin/inventory";
import type { ProductFormData } from "@/lib/db-inventory";
import type {
  ProductForm,
  ProductFormInput,
  ProductFormValues,
} from "./product-form-types";

const MAX_SINGLE_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export interface ProductImages {
  existingImages: string[];
  previews: string[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeExistingImage: (url: string) => void;
  removeNewImage: (index: number) => void;
}

function defaultValues(initialData: ProductFormData | null): ProductFormInput {
  if (!initialData) {
    return {
      name: "",
      slug: "",
      description: "",
      price: "",
      promoPrice: "",
      weight: "",
      stock: 0,
      statusId: "",
      categoryIds: [],
      ingredientIds: [],
    };
  }

  return {
    name: initialData.name,
    slug: initialData.slug,
    description: initialData.description || "",
    price: initialData.price.toString(),
    promoPrice: initialData.promoPrice?.toString() || "",
    weight: initialData.weight || "",
    stock: initialData.stock,
    statusId: initialData.status?.id || "",
    categoryIds: initialData.categories?.map((c) => c.id) || [],
    ingredientIds: initialData.ingredients?.map((i) => i.id) || [],
  };
}

/**
 * Stan i wysyłka formularza produktu.
 *
 * Wydzielone z komponentu, który trzymał to razem z 360 liniami layoutu.
 * Dzięki temu walidację rozmiaru plików i budowanie FormData da się czytać
 * bez przewijania przez pola formularza.
 */
export function useProductForm(initialData: ProductFormData | null) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.images?.map((img) => img.url) || []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const form: ProductForm = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues(initialData),
  });

  const watchedName = form.watch("name");
  useEffect(() => {
    if (!watchedName) return;

    const slug = watchedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  }, [watchedName, form]);

  const images: ProductImages = {
    existingImages,
    previews,
    handleFileChange: (event) => {
      if (!event.target.files) return;

      const files = Array.from(event.target.files);
      setNewImageFiles((prev) => [...prev, ...files]);
      setPreviews((prev) => [
        ...prev,
        ...files.map((file) => URL.createObjectURL(file)),
      ]);
    },
    removeExistingImage: (url) =>
      setExistingImages((prev) => prev.filter((u) => u !== url)),
    removeNewImage: (index) => {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    },
  };

  /** Zwraca komunikat, jeśli wybrane pliki nie przejdą kontroli rozmiaru. */
  const rejectOversizedFiles = (): string | null => {
    const tooBig = newImageFiles.find((f) => f.size > MAX_SINGLE_FILE_SIZE);
    if (tooBig) return t("validation.fileTooLarge", { name: tooBig.name });

    const total = newImageFiles.reduce((sum, f) => sum + f.size, 0);
    return total > MAX_TOTAL_SIZE ? t("validation.uploadTooLarge") : null;
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    const oversized = rejectOversizedFiles();
    if (oversized) return toast.error(oversized);

    // Sprawdzane przed zbudowaniem FormData, nie po — wcześniej ta kontrola
    // stała za appendami, więc praca szła na marne.
    if (values.promoPrice && values.price && values.price <= values.promoPrice) {
      return toast.error(t("validation.promoTooHigh"));
    }

    setLoading(true);
    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, val]) => {
        if (key === "categoryIds" || key === "ingredientIds") return;
        formData.append(key, val !== null && val !== undefined ? String(val) : "");
      });

      formData.append("categoryIds", JSON.stringify(values.categoryIds));
      formData.append("ingredientIds", JSON.stringify(values.ingredientIds));
      formData.append("existingImages", JSON.stringify(existingImages));
      newImageFiles.forEach((file) => formData.append("newImages", file));

      const res = await upsertProduct(initialData?.id || "new", formData);
      if (!res.ok) return toast.error(res.message);

      toast.success(t("feedback.productSaved"));
      router.push("/dashboard/inventory");
      router.refresh();
    } catch {
      toast.error(t("feedback.storageError"));
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, images, onSubmit };
}
