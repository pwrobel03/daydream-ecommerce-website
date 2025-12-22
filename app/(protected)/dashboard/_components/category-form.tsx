"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/schemas";
import { createCategory } from "@/actions/admin/admin-categories";
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

export function CategoryForm({
  parentCategories,
}: {
  parentCategories: any[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      isSubcategory: false,
      parentId: "",
    },
  });

  const isSub = form.watch("isSubcategory");

  async function onSubmit(values: any) {
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

      if (res?.success) {
        toast.success(res.success);

        // 1. Resetowanie pól tekstowych i checkboxów
        form.reset();

        // 2. Ręczne czyszczenie inputa typu file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // 3. Wymuszenie odświeżenia Server Componentu (strony page.tsx)
        router.refresh();
      } else if (res?.error) {
        toast.error(res.error);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } catch (error) {
      console.error("SUBMIT_ERROR:", error);
      toast.error("Connection error", {
        description:
          "The server could not process the request. Your're image could be too large or corrupted. Our limit is 8MB",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 p-10 rounded-[2.5rem] border shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black italic uppercase text-md tracking-widest">
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="E.g. Dark Stories"
                    {...field}
                    className="rounded-xl h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel className="font-black italic uppercase text-md tracking-widest">
              Cover Image
            </FormLabel>
            <FormControl>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) => form.setValue("image", e.target.files)}
                className="rounded-xl h-12 pt-2 cursor-pointer"
              />
            </FormControl>
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-black italic uppercase text-md tracking-widest">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the story of this category..."
                  {...field}
                  className="rounded-[1.5rem] min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-6 p-6 bg-input/30 rounded-[2rem] border">
          <FormField
            control={form.control}
            name="isSubcategory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-6 h-6 rounded-md data-[state=checked]:bg-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-black italic uppercase text-xs tracking-widest">
                    This is a subcategory
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {isSub && (
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem className="animate-in slide-in-from-top-2 duration-300">
                  <FormLabel className="font-black italic uppercase text-[10px] tracking-widest">
                    Parent Category
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select parent..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {parentCategories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="font-medium"
                        >
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

        <button
          type="submit"
          disabled={loading}
          className="w-full h-16 bg-zinc-900 text-white rounded-full font-black italic uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 active:scale-95"
        >
          {loading ? "Forging..." : "Forge Category"}
        </button>
      </form>
    </Form>
  );
}
