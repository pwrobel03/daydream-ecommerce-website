"use client";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ResetPasswordSchema } from "@/schemas";
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
import { resetPassword } from "@/actions/auth/reset-password";
import Link from "next/link";
import { Zap, Radio, Cpu, ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export const ResetForm = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      resetPassword(values).then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    });
  };

  return (
    <div className="w-full mx-auto lg:grid lg:grid-cols-2 gap-12 items-center px-12 py-16 bg-card/60 rounded-[2rem]">
      {/* LEWA STRONA: WIZUALIZACJA (Signal Transmission) */}
      <div className="hidden lg:flex flex-col items-center justify-center relative p-20 border-r-2 border-black/5 dark:border-white/5 min-h-[600px]">
        <div className="relative group">
          {/* Pulsująca poświata sygnału */}
          <div
            className={cn(
              "absolute inset-0 blur-[120px] rounded-full scale-150 transition-all duration-1000",
              success ? "bg-emerald-500/20" : "bg-primary/20"
            )}
          />

          <Radio
            className={cn(
              "w-64 h-64 text-foreground relative z-10 opacity-90 transition-all duration-700",
              isPending && "animate-pulse scale-110"
            )}
            strokeWidth={0.5}
          />

          {/* Rozchodzące się kręgi sygnału */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border border-primary/20 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] border border-primary/10 rounded-full animate-[ping_3s_linear_infinite]" />
        </div>
      </div>

      {/* PRAWA STRONA: FORMULARZ */}
      <div className="w-full mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              Recovery_Protocol
            </span>
            <div className="w-12 h-1 bg-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            RECOVER
            <br />
            <span className="text-primary">ACCESS.</span>
          </h1>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                      Target_Registry_Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="USER@DAYDREAM.COM"
                        type="email"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black italic uppercase tracking-tighter focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase italic" />
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
                  {isPending ? "Dispatching..." : "Send Reset Link"}
                </span>
                <Radio
                  className={cn("w-10 h-10", isPending && "animate-pulse")}
                />
              </div>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </form>
        </Form>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase italic tracking-tighter opacity-30">
            Remembered?{" "}
            <Link href="/auth/login" className="text-primary underline">
              Back to Vault
            </Link>
          </p>
          <Globe className="w-4 h-4 opacity-10" />
        </div>
      </div>

      {/* BACKGROUND DECOR */}
      <div className="absolute bottom-10 right-10 hidden lg:flex items-center gap-4 opacity-10 font-mono text-[10px] rotate-90 origin-right">
        <Cpu className="w-4 h-4" />
        <span>BROADCASTING_RECOVERY_SIGNAL...</span>
      </div>
    </div>
  );
};
