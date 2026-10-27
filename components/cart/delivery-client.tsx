// components/checkout/delivery-client.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { finalizeAndPay } from "@/actions/order/order"; // Twoja akcja Stripe
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

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
import { Loader2, BookmarkCheck } from "lucide-react";
import type { DeliveryOrder, UserAddress } from "@/lib/db-orders";

interface DeliveryClientProps {
  order: DeliveryOrder;
  savedAddress: UserAddress | null;
}

export function DeliveryClient({ order, savedAddress }: DeliveryClientProps) {
  const t = useTranslations("delivery");
  const tDemo = useTranslations("demo");
  const readOnlyReason = useReadOnlyReason();
  const [loading, setLoading] = useState(false);
  const { resetCart } = useCart();

  // Same rules as AddressSchema, which the server applies again; only the messages are localized.
  const schema = z.object({
    fullName: z.string().min(3, t("errFullName")),
    street: z.string().min(5, t("errStreet")),
    city: z.string().min(2, t("errCity")),
    zipCode: z.string().min(5, t("errZipCode")),
    phone: z.string().min(9, t("errPhone")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: savedAddress || {
      fullName: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);

    // Wywołujemy akcję Stripe, przekazując ID zamówienia i dane adresowe
    const res = await finalizeAndPay(order.id, values);

    if (!res.ok) {
      toast.error(res.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    resetCart();
    toast.success(t("redirecting"));
    window.location.assign(res.data.url);
  }

  const fields = [
    { name: "fullName", label: t("fullName"), placeholder: t("fullNamePlaceholder"), autoComplete: "name" },
    { name: "phone", label: t("phone"), placeholder: "+48 600 100 200", autoComplete: "tel" },
    { name: "street", label: t("street"), placeholder: t("streetPlaceholder"), autoComplete: "street-address" },
    { name: "zipCode", label: t("zipCode"), placeholder: "00-000", autoComplete: "postal-code" },
    { name: "city", label: t("city"), placeholder: "", autoComplete: "address-level2" },
  ] as const;

  return (
    <div className="max-w-xl space-y-6">
      {savedAddress && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted p-4 text-sm">
          <BookmarkCheck className="mt-0.5 size-4 shrink-0 text-primary-text" aria-hidden />
          <span>{t("savedAddress")}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {fields.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete={f.autoComplete}
                        placeholder={f.placeholder}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <p className="text-sm text-muted-foreground">{tDemo("testCard")}</p>
          {readOnlyReason && (
            <p className="text-sm text-muted-foreground">{readOnlyReason}</p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !!readOnlyReason}
            title={readOnlyReason}
          >
            {loading ? <Loader2 className="animate-spin" /> : t("payment")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
