"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AddressSchema } from "@/schemas/index";
import { saveUserAddress } from "@/actions/address";
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
import { MapPin, Loader2 } from "lucide-react";

export function AddressForm({ initialData }: { initialData: any }) {
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
    if (res.success) toast.success("Registry Updated");
    if (res.error) toast.error(res.error);
    setLoading(false);
  }

  // Wspólny styl dla inputów Artifact Essence
  const artifactInputStyle =
    "bg-input/40 rounded-[1rem] h-14 text-lg font-black italic tracking-tighter transition-all";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <Card className="bg-card/60 rounded-[2rem] overflow-hidden">
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

        <Card className="bg-card/60 border-black/5 rounded-[2.5rem] overflow-hidden">
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-24 bg-black hover:bg-primary text-white rounded-[2rem] text-3xl font-black italic uppercase tracking-tighter transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="flex items-center gap-4">
              Update Registry <MapPin size={28} />
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
