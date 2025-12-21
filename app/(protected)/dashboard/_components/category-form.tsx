"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/schemas";
import { createCategory } from "@/actions/admin/admin-categories";
import { useState } from "react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
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
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    if (values.isSubcategory) formData.append("parentId", values.parentId);
    if (values.image?.[0]) formData.append("image", values.image[0]);

    const res = await createCategory(formData);

    if (res.success) {
      toast.success(res.success);
      form.reset();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* NAME */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black italic uppercase text-[10px] tracking-widest">
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="E.g. Dark Stories"
                    {...field}
                    className="rounded-xl border-black/5 h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* IMAGE */}
          <FormItem>
            <FormLabel className="font-black italic uppercase text-[10px] tracking-widest">
              Cover Image
            </FormLabel>
            <FormControl>
              <Input
                type="file"
                onChange={(e) => form.setValue("image", e.target.files)}
                className="rounded-xl border-black/5 h-12 pt-2"
              />
            </FormControl>
          </FormItem>
        </div>

        {/* DESCRIPTION */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-black italic uppercase text-[10px] tracking-widest">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the story of this category..."
                  {...field}
                  className="rounded-[1.5rem] border-black/5 min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SUBCATEGORY LOGIC */}
        <div className="flex flex-col gap-6 p-6 bg-zinc-50 rounded-[2rem] border border-black/5">
          <FormField
            control={form.control}
            name="isSubcategory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-6 h-6 rounded-md border-black/20 data-[state=checked]:bg-primary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-black italic uppercase text-[10px] tracking-widest">
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
                      <SelectTrigger className="rounded-xl h-12 border-black/10">
                        <SelectValue placeholder="Select parent..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-black/10">
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
          className="w-full h-16 bg-zinc-900 text-white rounded-full font-black italic uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Forge Category"}
        </button>
      </form>
    </Form>
  );
}
