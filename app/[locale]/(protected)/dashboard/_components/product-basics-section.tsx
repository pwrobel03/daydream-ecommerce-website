"use client";

import { Tag } from "lucide-react";
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
import type { Status } from "@/types/product";
import type { ProductSectionProps } from "./product-form-types";

export function ProductBasicsSection({
  form,
  loading,
  statuses,
}: ProductSectionProps & { statuses: Status[] }) {
  const t = useTranslations("dashboard");

  return (
  <div className="bg-card/60 p-10 rounded-[2rem] border space-y-6">
    <div className="flex items-center gap-3">
      <Tag size={18} className="text-primary-text" />
      <h2 className="text-xl font-black italic uppercase tracking-tight">
        Artifact Essence
      </h2>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
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
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
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
        control={form.control}
        name="weight"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
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
        control={form.control}
        name="statusId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
              Status
            </FormLabel>
            <Select
              disabled={loading}
              onValueChange={field.onChange}
              defaultValue={field.value ?? ""}
            >
              <FormControl>
                <SelectTrigger className="rounded-md font-black w-full">
                  <SelectValue placeholder={t("labels.status")} />
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
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-black uppercase tracking-widest text-foreground/70">
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
  );
}
