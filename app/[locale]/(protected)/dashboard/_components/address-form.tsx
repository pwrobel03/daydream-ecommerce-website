"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AddressSchema } from "@/schemas/index";
import { saveUserAddress } from "@/actions/user/address";
import { toast } from "sonner";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { UserAddress } from "@/lib/db-orders";

export function AddressForm({
  initialData,
}: {
  initialData: UserAddress | null;
}) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof AddressSchema>>({
    resolver: zodResolver(AddressSchema),
    defaultValues: initialData || {
      fullName: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof AddressSchema>) {
    setLoading(true);
    const res = await saveUserAddress(values);
    if (res.ok) toast.success(t("feedback.saved"));
    else toast.error(res.message);
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold leading-[1.35]">{t("address.contact")}</h2>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address.fullName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("address.namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address.phone")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("address.phonePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold leading-[1.35]">{t("address.location")}</h2>

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address.street")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("placeholders.street")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address.zipCode")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("address.zipPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address.city")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("address.cityPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
        <Button type="submit" disabled={loading || !!readOnlyReason} title={readOnlyReason}>
          {loading ? <Loader2 className="animate-spin" /> : t("address.save")}
        </Button>
      </form>
    </Form>
  );
}
