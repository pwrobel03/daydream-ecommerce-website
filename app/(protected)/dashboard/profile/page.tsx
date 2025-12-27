"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/settings";
import { useCurrentUser } from "@/hooks/use-current-user";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { Loader2, UserCog, ShieldCheck, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const user = useCurrentUser();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user?.name || undefined,
      email: user?.email || undefined,
      password: undefined,
      newPassword: undefined,
    },
  });

  // Naprawa błędu "weird redirect": Resetujemy formularz, gdy sesja się załaduje
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || undefined,
        email: user.email || undefined,
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) setError(data.error);
          if (data.success) {
            update(); // Odświeża sesję klienta
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Critical transmission error"));
    });
  };

  const artifactInputStyle =
    "bg-input/40 rounded-[1rem] h-14 text-lg font-black italic tracking-tighter transition-all focus-visible:ring-primary/20";
  const labelStyles =
    "text-sm font-black uppercase tracking-widest ml-1 opacity-40";

  return (
    <>
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        {/* NAGŁÓWEK STRONY */}
        <header className="mb-20 relative">
          <div className="absolute -left-8 top-0 text-[12rem] font-black italic opacity-[0.03] select-none leading-none">
            USER
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none relative z-10">
            Profile<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] opacity-40 mt-6 flex items-center gap-4">
            <Fingerprint size={14} className="text-primary" />
            Identity and Security Protocol Management
          </p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
            {/* SEKCJA 1: PUBLIC IDENTITY */}
            <Card className="bg-card/60 rounded-[2.5rem] border-none shadow-none overflow-hidden">
              <CardContent className="p-8 md:p-12 space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <UserCog className="text-primary" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-40">
                    Identity
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Display Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            className={artifactInputStyle}
                            placeholder="Identity"
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-bold italic uppercase" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelStyles}>
                          Electronic Signal (Email)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending || user?.isOAuth}
                            className={cn(
                              artifactInputStyle,
                              user?.isOAuth && "opacity-50 cursor-not-allowed"
                            )}
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEKCJA 2: SECURITY (Ukryta dla OAuth) */}
            {user?.isOAuth !== true && (
              <Card className="bg-card/60 rounded-[2.5rem] border-none shadow-none overflow-hidden">
                <CardContent className="p-8 md:p-12 space-y-8">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-primary" size={20} />
                    <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-40">
                      Encryption
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelStyles}>
                            Current Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              className={artifactInputStyle}
                              type="password"
                              placeholder="******"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelStyles}>
                            New Sequence
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              className={artifactInputStyle}
                              type="password"
                              placeholder="******"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STATUSY I PRZYCISK */}
            <div className="space-y-6">
              <FormError message={error} />
              <FormSuccess message={success} />

              <Button
                disabled={isPending}
                type="submit"
                className="w-full h-24 bg-black hover:bg-primary text-white rounded-[2rem] text-3xl font-black italic uppercase tracking-tighter transition-all active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default SettingsPage;
