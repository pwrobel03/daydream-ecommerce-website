"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import GiveInNotice from "./give-in-notice";

import { upsertIngredient } from "@/actions/admin/admin-ingredients";
import { Button } from "@/components/ui/button"; // Zakładam shadcn/ui
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// 1. Walidacja Zod
const formSchema = z.object({
  name: z.string().min(2, "The name is required"),
  description: z.string().optional(),
});

type IngredientFormValues = z.infer<typeof formSchema>;

interface IngredientFormProps {
  initialData?: any | null; // Dane z bazy jeśli edytujemy
}

export const IngredientForm = ({ initialData }: IngredientFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || { name: "", description: "" },
  });

  // Obsługa zmiany pliku
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Plik jest za duży (max 5MB)");
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
      if (!preview && initialData?.imageUrl) {
        formData.append("removeImage", "true");
      }

      const res = await upsertIngredient(initialData?.id || "new", formData);

      if (res.success) {
        toast.success(res.success);
        router.push("/dashboard/ingredients");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas zapisywania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
      <GiveInNotice note="When you edit an ingredient, you change it in all products that contain it!" />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full items-center"
      >
        <div className="flex flex-col gap-8">
          {/* Sekcja Tekstowa */}
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <label className="text-sm uppercase tracking-widest font-black">
                Ingredient name
              </label>
              <Input
                {...form.register("name")}
                placeholder="etc. Erytrytol"
                className="font-black"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Sekcja Zdjęcia */}
          <div className="space-y-4 gap-4 flex flex-col">
            <label className="text-sm uppercase tracking-widest font-black mb-10">
              Ingredient icon
            </label>
            <div className="border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center relative min-h-[250px] bg-card/50">
              {preview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-0 right-0 p-2 bg-destructive/80 text-white rounded-full hover:bg-destructive transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center group">
                  <div className="p-4 bg-input/40 rounded-full shadow-sm group-hover:scale-110 transition duration-200">
                    <Upload className="text-primary" size={32} />
                  </div>
                  <span className="mt-4 text-sm font-medium">
                    Add image WebP/PNG/JPG
                  </span>
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

        <div className="flex justify-end gap-4 border-t pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[150px] cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Save Ingredient
          </Button>
        </div>
      </form>
    </div>
  );
};
