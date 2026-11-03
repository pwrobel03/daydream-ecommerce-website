"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import GiveInNotice from "./give-in-notice";

import { upsertIngredient } from "@/actions/admin/ingredients";
import { Button } from "@/components/ui/button"; // Zakładam shadcn/ui
import { Input } from "@/components/ui/input";
import type { IngredientOption } from "@/lib/db-inventory";

// Schemat powstaje w ciele komponentu, bo komunikat walidacji jest widoczny
// dla użytkownika i musi być w jego języku — a hooka nie da się wywołać
// w zasięgu modułu.
function buildSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(2, t("validation.nameRequired")),
    description: z.string().optional(),
  });
}

type IngredientFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface IngredientFormProps {
  initialData?: IngredientOption | null; // Dane z bazy jeśli edytujemy
}

export const IngredientForm = ({ initialData }: IngredientFormProps) => {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialData?.image || null
  );

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: initialData || { name: "", description: "" },
  });

  // Obsługa zmiany pliku
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error(t("ingredients.fileTooLarge"));
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const onSubmit = async (values: IngredientFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");

      if (file) {
        formData.append("image", file);
      }

      // Jeśli edytujemy i usuwamy zdjęcie (brak pliku i brak podglądu)
      if (!preview && initialData?.image) {
        formData.append("removeImage", "true");
      }

      const res = await upsertIngredient(initialData?.id || "new", formData);

      if (!res.ok) return toast.error(res.message);

      toast.success(t("feedback.ingredientSaved"));
      router.push("/dashboard/ingredients");
      router.refresh();
    } catch {
      toast.error(t("ingredients.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <GiveInNotice note={t("ingredients.note")} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="ingredient-name" className="text-sm font-medium">
              {t("ingredients.name")}
            </label>
            <Input
              id="ingredient-name"
              {...form.register("name")}
              placeholder={t("ingredients.namePlaceholder")}
              disabled={loading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("ingredients.icon")}</span>
            <div className="relative flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-6">
              {preview ? (
                <div className="relative flex items-center justify-center">
                  <div className="relative size-28 overflow-hidden rounded-full border">
                    <Image
                      src={preview}
                      alt={t("labels.preview")}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t("ingredients.removeImage")}
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute -right-12 top-0"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-3 text-center">
                  <Upload aria-hidden className="size-8 text-muted-foreground" />
                  <span className="text-sm">{t("ingredients.addImage")}</span>
                  <input
                    disabled={loading}
                    type="file"
                    className="hidden"
                    onChange={onFileChange}
                    accept="image/*"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-6">
          {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {t("ingredients.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading || !!readOnlyReason}
            title={readOnlyReason}
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            {t("ingredients.save")}
          </Button>
        </div>
      </form>
    </div>
  );
};
