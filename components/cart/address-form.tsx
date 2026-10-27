// @/components/cart/AddressForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

type AddressValues = {
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  phone: string;
};

export function AddressForm({
  initialData,
  onSubmit,
  isLoading,
}: {
  initialData?: Partial<AddressValues> | null;
  onSubmit: (values: AddressValues) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("delivery");
  const schema = z.object({
    fullName: z.string().min(3, t("errFullName")),
    street: z.string().min(5, t("errStreet")),
    city: z.string().min(2, t("errCity")),
    zipCode: z.string().min(5, t("errZipCode")),
    phone: z.string().min(9, t("errPhone")),
  });
  const form = useForm<AddressValues>({
    resolver: zodResolver(schema),
    defaultValues: (initialData as AddressValues) || {
      fullName: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  const fields = [
    ["fullName", t("fullName")],
    ["street", t("street")],
    ["city", t("city")],
    ["zipCode", t("zipCode")],
    ["phone", t("phone")],
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(([name, label]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" aria-label={t("processing")} /> : t("payment")}
        </Button>
      </form>
    </Form>
  );
}
