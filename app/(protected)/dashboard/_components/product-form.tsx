"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { productSchema } from "@/schemas";
import { upsertProduct } from "@/actions/admin/admin-inventory";
import { ProductType, StatusType } from "@/types/product";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, ImageIcon, Tag, Layers, Beaker, Loader2 } from "lucide-react";

import {
  Form,
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import GiveInNotice from "./give-in-notice";

// Typ wygenerowany ze schematu
type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: ProductType | null;
  categories: any[];
  ingredients: any[];
  statuses: StatusType[];
}

export function ProductForm({
  initialData,
  categories = [],
  ingredients = [],
  statuses = [],
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.images?.map((img) => img.url) || []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // KLUCZOWA POPRAWKA TYPÓW
  const form = useForm<ProductFormValues>({
    // Używamy 'as any', aby ominąć błąd niezgodności kluczy w bibliotece resolvera
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || "",
          price: initialData.price.toString(),
          promoPrice: initialData.promoPrice?.toString() || "",
          weight: initialData.weight || "",
          stock: initialData.stock,
          statusId: initialData.status?.id || "",
          categoryIds:
            (initialData as any).categories?.map((c: any) => c.id) || [],
          ingredientIds: initialData.ingredients?.map((i) => i.id) || [],
        }
      : {
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
        },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImageFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const watchedName = form.watch("name");
  useEffect(() => {
    if (watchedName) {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      form.setValue("slug", slug, { shouldValidate: true });
    }
  }, [watchedName, form, initialData]);

  // SubmitHandler z naszym typem
  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    setLoading(true);
    try {
      const MAX_SINGLE_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

      let currentTotalSize = 0;

      for (const file of newImageFiles) {
        // Sprawdzenie pojedynczego pliku
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          toast.error(`Plik ${file.name} jest za duży (max 8MB)`);
          setLoading(false);
          return; // Przerywamy wysyłanie
        }
        currentTotalSize += file.size;
      }

      // Sprawdzenie łącznego rozmiaru
      if (currentTotalSize > MAX_TOTAL_SIZE) {
        toast.error("Łączny rozmiar nowych zdjęć przekracza 50MB");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      Object.entries(values).forEach(([key, val]) => {
        if (key !== "categoryIds" && key !== "ingredientIds") {
          formData.append(
            key,
            val !== null && val !== undefined ? String(val) : ""
          );
        }
      });

      if (
        values.promoPrice &&
        values.price &&
        values.price <= values.promoPrice
      )
        return toast.error("You're price cannot be lower than promo price");

      formData.append("categoryIds", JSON.stringify(values.categoryIds));
      formData.append("ingredientIds", JSON.stringify(values.ingredientIds));
      formData.append("existingImages", JSON.stringify(existingImages));
      newImageFiles.forEach((file) => formData.append("newImages", file));

      const res = await upsertProduct(initialData?.id || "new", formData);

      if (res.success) {
        toast.success(res.success);
        router.push("/dashboard/inventory");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("An error occurred during storage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        // Ponownie rzutujemy onSubmit na any, aby uniknąć błędów TFieldValues
        onSubmit={form.handleSubmit(onSubmit as any)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
      >
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-card/60 p-10 rounded-[2rem] border space-y-6">
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-primary" />
              <h2 className="text-xl font-black italic uppercase tracking-tight">
                Artifact Essence
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={loading}
                        className="rounded-md font-black"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
                      Slug
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-md h-12 border-none font-black cursor-not-allowed"
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

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control as any}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
                      Weight
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        {...field}
                        value={field.value ?? ""}
                        className="rounded-md font-black"
                        placeholder="Like: 500g"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="statusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
                      Status
                    </FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md font-black w-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md">
                        <SelectItem disabled={loading} value="none">
                          No Status
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
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      {...field}
                      value={field.value ?? ""}
                      className="rounded-md min-h-30 font-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-card/60 p-10 rounded-[2rem] border">
            <div className="flex justify-between mb-8 flex-row flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-primary" />
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Media
                </h2>
              </div>
              <label className="cursor-pointer max-w-40 bg-zinc-900 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest hover:bg-primary transition-all">
                Upload{" "}
                <input
                  disabled={loading}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-3 md:grid-cols-2 gap-4">
              {existingImages.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-md overflow-hidden border"
                >
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    disabled={loading}
                    type="button"
                    onClick={() =>
                      setExistingImages((p) => p.filter((u) => u !== url))
                    }
                    className="absolute top-2 right-2 bg-white rounded-full p-1 text-destructive/50 shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-md overflow-hidden border-primary/20 border"
                >
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviews((p) => p.filter((_, i) => i !== idx));
                      setNewImageFiles((p) => p.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 text-destructive/50 shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <GiveInNotice note="Note: The recommended image resolution is up to 2048x2048 pixels. Photos with square aspect ratio will look the best." />

        <div className="lg:col-span-5 space-y-8">
          <div className="p-10 rounded-[2rem] shadow-2xl space-y-6 bg-card/60">
            <h2 className="text-xl font-black italic uppercase tracking-tight text-primary">
              Economics
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control as any}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
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
                control={form.control as any}
                name="promoPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
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
              control={form.control as any}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/60">
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

          <div className="bg-card/60 p-10 rounded-[2rem] border space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h3 className="font-black uppercase italic text-sm">
                  Taxonomy
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {categories.map((cat: any) => (
                  // <div key={cat.id}>
                  //   <label className="flex items-center gap-3 p-2 rounded-md hover:bg-input/40 cursor-pointer">
                  //     <input
                  //       type="checkbox"
                  //       checked={form.watch("categoryIds")?.includes(cat.id)}
                  //       onChange={(e) => {
                  //         const current = form.getValues("categoryIds") || [];
                  //         form.setValue(
                  //           "categoryIds",
                  //           e.target.checked
                  //             ? [...current, cat.id]
                  //             : current.filter((id) => id !== cat.id)
                  //         );
                  //       }}
                  //       className="w-4 h-4 rounded"
                  //     />
                  //     <span className="text-xs font-black uppercase tracking-widest">
                  //       {cat.name}
                  //     </span>
                  //   </label>
                  // </div>
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
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing: any) => (
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-24 bg-zinc-900 text-white rounded-[2rem] font-black uppercase italic text-xl hover:bg-primary transition-all shadow-2xl"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : initialData ? (
              "Confirm Essence"
            ) : (
              "Forge Essence"
            )}
          </button>
        </div>
      </form>
    </Form>
  );
}
