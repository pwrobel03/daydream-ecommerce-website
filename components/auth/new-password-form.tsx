"use client";

import { useForm } from "react-hook-form";
import { useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NewPasswordSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { useSearchParams } from "next/navigation";
import { newPassword } from "@/actions/new-password";
import Link from "next/link";
import {
  RefreshCcw,
  KeyRound,
  ShieldAlert,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NewPasswordForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    if (!token) {
      return setError("Security token missing. Protocol aborted.");
    }
    startTransition(() => {
      newPassword(values, token).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    });
  };

  // Style Hydration Loader
  if (!isMounted) {
    return (
      <div className="w-full max-w-[500px] mx-auto py-40 flex flex-col items-center justify-center gap-6">
        <RefreshCcw className="w-12 h-12 animate-spin text-primary opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20 italic">
          Initializing_Secure_Terminal...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto lg:grid lg:grid-cols-2 gap-12 items-center px-12 py-16 bg-card/60 rounded-[2rem]">
      {/* LEWA STRONA: FORMULARZ RESETOWANIA */}
      <div className="w-full mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-1 bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              Security_Override
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            KEY
            <br />
            <span className="text-primary">REGEN.</span>
          </h1>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                      New_Access_Key
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="••••••••••••"
                        type="password"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black italic tracking-[0.4em] focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                      Verify_Sequence
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="••••••••••••"
                        type="password"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black tracking-[0.4em] focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase" />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormError message={error} />
              <FormSuccess message={success} />
            </div>

            <Button
              disabled={isPending}
              type="submit"
              className="w-full py-12 bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-700 group relative overflow-hidden rounded-full"
            >
              <div className="relative z-10 flex items-center justify-center gap-12 w-full px-8">
                <span className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-center">
                  {isPending ? "Regenerating..." : "Update Key"}
                </span>
                <RefreshCcw
                  className={cn("w-10 h-10", isPending && "animate-spin")}
                />
              </div>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </form>
        </Form>

        <p className="text-[10px] font-black uppercase italic tracking-tighter opacity-30">
          Abort mission?{" "}
          <Link href="/auth/login" className="text-primary underline italic">
            Back to Security Vault
          </Link>
        </p>
      </div>

      {/* PRAWA STRONA: WIZUALIZACJA */}
      <div className="hidden lg:flex flex-col items-center justify-center relative p-20 border-l-2 border-black/5 dark:border-white/5 min-h-[600px]">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-1000" />
          <KeyRound
            className="w-64 h-64 text-foreground relative z-10 opacity-90 group-hover:rotate-12 transition-transform duration-500"
            strokeWidth={0.5}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-primary/20 rounded-full animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-dashed border border-primary/10 rounded-full animate-pulse" />
        </div>

        {/* BACKGROUND DECOR */}
        <div className="absolute bottom-10 right-10 flex items-center gap-4 opacity-10 font-mono text-[10px] rotate-90 origin-right">
          <Cpu className="w-4 h-4" />
          <span>RECONFIGURING_ACCESS_LADDER_SEQUENCE...</span>
        </div>
      </div>
    </div>
  );
};
