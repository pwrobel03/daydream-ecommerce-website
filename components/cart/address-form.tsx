// @/components/cart/AddressForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const addressSchema = z.object({
  fullName: z.string().min(3, "Full name required"),
  street: z.string().min(3, "Street required"),
  city: z.string().min(2, "City required"),
  zipCode: z.string().min(5, "Valid zip required"),
  phone: z.string().min(9, "Phone required"),
});

export function AddressForm({ initialData, onSubmit, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      fullName: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">
                Odbiorca
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="rounded-xl h-14 border-black/5 bg-card/40"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Ulica
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="rounded-xl h-14 border-black/5 bg-card/40"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Miasto
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="rounded-xl h-14 border-black/5 bg-card/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Kod pocztowy
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="rounded-xl h-14 border-black/5 bg-card/40"
                  />
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Telefon
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="rounded-xl h-14 border-black/5 bg-card/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-20 bg-zinc-900 text-white rounded-full font-black italic uppercase text-xl hover:bg-primary transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Confirm Essence"
          )}
        </button>
      </form>
    </Form>
  );
}
