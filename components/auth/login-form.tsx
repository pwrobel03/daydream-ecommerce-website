"use client";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Fingerprint,
  Lock,
  ShieldCheck,
  Activity,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const LoginForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const data = await login(values);
      if (data?.error) return setError(data.error);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid Registry Key");
      } else {
        setSuccess("Identity Verified. Accessing Archive...");
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full mx-auto lg:grid lg:grid-cols-2 gap-12 items-center px-12 py-16 bg-card/60 rounded-[2rem]">
      {/* LEWA STRONA: FORMULARZ */}
      <div className="w-full mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-1 bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              System_Login
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            IDENTITY
            <br />
            <span className="text-primary">VAULT.</span>
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
                      Registry_Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="USER@DAYDREAM.COM"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black italic uppercase tracking-tighter focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-end">
                      <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                        Access_Protocol
                      </FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[9px] font-black uppercase opacity-30 hover:text-primary transition-all"
                      >
                        Recovery?
                      </Link>
                    </div>
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
                <span className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">
                  {isPending ? "Validating..." : "Login"}
                </span>
                <Fingerprint
                  className={cn("w-10 h-10", isPending && "animate-pulse")}
                />
              </div>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </form>
        </Form>

        <p className="text-[10px] font-black uppercase italic tracking-tighter opacity-30">
          New Identity Required?{" "}
          <Link href="/auth/register" className="text-primary underline">
            Initialize Registration
          </Link>
        </p>
      </div>

      {/* PRAWA STRONA: WIZUALIZACJA (Tylko na LG) */}
      <div className="hidden lg:flex flex-col items-center justify-center relative p-20 border-l-2 border-black/5 dark:border-white/5 min-h-[600px]">
        {/* DUŻA KŁÓDKA Z POŚWIATĄ */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-1000" />
          <Lock
            className="w-64 h-64 text-foreground relative z-10 opacity-90 group-hover:scale-105 transition-transform duration-700"
            strokeWidth={0.5}
          />

          {/* Animowany pierścień skanujący */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-dashed border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        </div>

        {/* PŁYNĄCY TEKST TECHNICZNY (W tle) */}
        <div className="absolute bottom-10 right-10 flex items-center gap-4 opacity-10 font-mono text-[10px] rotate-90 origin-right">
          <Cpu className="w-4 h-4" />
          <span>ENCRYPTING_METABOLIC_DATA_STREAM...</span>
        </div>
      </div>
    </div>
  );
};
