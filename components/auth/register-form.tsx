"use client";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
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
import { register } from "@/actions/register";
import Link from "next/link";
import { Atom, Dna, Globe, UserPlus, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export const RegisterForm = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      register(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <div className="w-full mx-auto lg:grid lg:grid-cols-2 gap-12 items-center px-12 py-16 bg-card/60 rounded-[2rem]">
      {/* LEWA STRONA: WIZUALIZACJA (Tylko na LG) - Lustrzane odbicie Login */}
      <div className="hidden lg:flex flex-col items-center justify-center relative p-20 border-r-2 border-black/5 dark:border-white/5 min-h-[600px]">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-1000" />
          <Atom
            className="w-64 h-64 text-foreground relative z-10 opacity-90 group-hover:rotate-180 transition-transform duration-[3000ms]"
            strokeWidth={0.5}
          />

          {/* Animowane pierścienie */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-primary/20 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-dashed border border-primary/10 rounded-full animate-[spin_20s_linear_infinite]" />
        </div>
      </div>

      {/* PRAWA STRONA: FORMULARZ */}
      <div className="w-full mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              System_Registration
            </span>
            <div className="w-12 h-1 bg-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            JOIN THE
            <br />
            <span className="text-primary">ARCHIVE.</span>
          </h1>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              {/* POLE: NAME */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                      Full_Identity_Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="EX: DAYDREAM USER"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black italic uppercase tracking-tighter focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase" />
                  </FormItem>
                )}
              />

              {/* POLE: EMAIL */}
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
                        type="email"
                        className="bg-transparent border-x-0 border-t-0 border-b-2 border-black/10 dark:border-white/10 rounded-none px-0 text-sm font-black italic uppercase tracking-tighter focus-visible:ring-0 focus-visible:border-primary transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase" />
                  </FormItem>
                )}
              />

              {/* POLE: PASSWORD */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                      Access_Key_Generation
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
              className="w-full py-12 bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-700 group relative overflow-hidden rounded-full mt-8"
            >
              <div className="relative z-10 flex items-center justify-center gap-12 w-full px-8">
                <span className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">
                  {isPending ? "Synthesizing..." : "Create Account"}
                </span>
                <Dna
                  className={cn("w-10 h-10", isPending && "animate-spin-slow")}
                />
              </div>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </form>
        </Form>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase italic tracking-tighter opacity-30">
            Already verified?{" "}
            <Link href="/auth/login" className="text-primary underline">
              Return to Vault
            </Link>
          </p>
          <Globe className="w-4 h-4 opacity-10" />
        </div>
      </div>
    </div>
  );
};
