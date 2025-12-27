// components/checkout/delivery-client.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AddressSchema } from "@/schemas/index";
import { finalizeAndPay } from "@/actions/order"; // Twoja akcja Stripe
import { useCart } from "@/hooks/use-cart";
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
import { CreditCard, Loader2, BookmarkCheck } from "lucide-react";

interface DeliveryClientProps {
  order: any;
  savedAddress: any; // Adres z profilu użytkownika
}

export function DeliveryClient({ order, savedAddress }: DeliveryClientProps) {
  const [loading, setLoading] = useState(false);
  const { resetCart } = useCart();

  const form = useForm<z.infer<typeof AddressSchema>>({
    resolver: zodResolver(AddressSchema),
    defaultValues: savedAddress || {
      fullName: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof AddressSchema>) {
    setLoading(true);

    // Wywołujemy akcję Stripe, przekazując ID zamówienia i dane adresowe
    const res = await finalizeAndPay(order.id, values);

    if (res.url) {
      setLoading(false);
      resetCart();
      toast.success("Redirecting to secure vault...");
      window.location.assign(res.url);
    } else {
      toast.error(res.error || "Acquisition failed");
      setLoading(false);
    }
  }

  const artifactInputStyle =
    "bg-input/40 rounded-[1rem] h-14 text-lg font-black italic tracking-tighter transition-all";

  return (
    <div className="space-y-12">
      {/* OPCJONALNY BANER: Jeśli znaleziono zapisany adres */}
      {savedAddress && (
        <div className="flex items-center gap-4 p-6 bg-primary/10 border border-primary/20 rounded-[1.5rem] italic font-bold text-sm">
          <BookmarkCheck className="text-primary" />
          <span>
            Artifact Registry recognized. Shipping coordinates pre-loaded.
          </span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* SEKCJA 1: IDENTITY (Taka sama jak w Dashboardzie) */}
          <Card className="bg-card/60 rounded-[2rem] overflow-hidden border-none shadow-none">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-40">
                  Consignee Identity
                </h2>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black uppercase tracking-widest ml-1">
                      Full Identity
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={artifactInputStyle}
                        placeholder="Enter Name..."
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-bold uppercase italic" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black uppercase tracking-widest ml-1">
                      Contact Signal
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={artifactInputStyle}
                        placeholder="+48 --- --- ---"
                      />
                    </FormControl>
                    <FormMessage className="text-sm font-bold uppercase italic" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SEKCJA 2: LOGISTICS */}
          <Card className="bg-card/60 rounded-[2rem] overflow-hidden border-none shadow-none">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 bg-zinc-900 rounded-full" />
                <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-40">
                  Logistics Coordinates
                </h2>
              </div>

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black uppercase tracking-widest ml-1">
                      Street Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={artifactInputStyle}
                        placeholder="Street & Number..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-black uppercase tracking-widest ml-1">
                        Postal Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className={artifactInputStyle}
                          placeholder="00-000"
                        />
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
                      <FormLabel className="text-sm font-black uppercase tracking-widest ml-1">
                        Sector / City
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className={artifactInputStyle}
                          placeholder="City Name..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* PRZYCISK PŁATNOŚCI */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-24 bg-black hover:bg-primary text-white rounded-[2rem] text-3xl font-black italic uppercase tracking-tighter transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="flex items-center gap-4">
                Pay with Stripe <CreditCard size={28} />
              </div>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
