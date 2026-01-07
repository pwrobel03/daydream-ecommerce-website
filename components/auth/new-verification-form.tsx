"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { newVerification } from "@/actions/new-verification";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import {
  ShieldCheck,
  Fingerprint,
  Loader2,
  ArrowRight,
  Activity,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NewVerificationForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Verification token is missing.");
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success || null);
        setError(data.error || null);
      })
      .catch(() => {
        setError("An unexpected error occurred.");
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="w-full mx-auto lg:grid lg:grid-cols-2 gap-12 items-center px-12 py-16 bg-card/60 rounded-[2rem]">
      {/* LEWA STRONA: STATUS WERYFIKACJI */}
      <div className="w-full mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-1 bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
              Identity_Validation
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            VERIFYING
            <br />
            <span className="text-primary">PROTOCOL.</span>
          </h1>
        </header>

        <div className="space-y-8">
          {/* DYNAMICZNY STATUS KOMUNIKATU */}
          <div className="min-h-[100px] flex flex-col justify-center">
            {!success && !error && (
              <div className="flex items-center gap-4 text-primary animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-black uppercase italic tracking-widest">
                  Analyzing Security Token...
                </span>
              </div>
            )}

            <FormError message={error || undefined} />
            <FormSuccess message={success || undefined} />
          </div>

          <p className="text-sm font-bold uppercase italic tracking-tighter text-muted-foreground leading-tight max-w-sm">
            Our system is currently cross-referencing your biological signature
            with the DAYDREAM Global Archive. Please do not close this terminal.
          </p>
        </div>

        {/* PRZYCISK POWROTU (AKTYWNY TYLKO PO ZAKOŃCZENIU) */}
        <div className="pt-8">
          <Link href="/auth/login">
            <button className="group flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full hover:bg-primary hover:text-white transition-all duration-500">
              <span className="text-[10px] font-black uppercase tracking-widest italic">
                {success ? "Proceed to Login" : "Abort & Return"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </Link>
        </div>
      </div>

      {/* PRAWA STRONA: WIZUALIZACJA SKANOWANIA */}
      <div className="hidden lg:flex flex-col items-center justify-center relative p-20 border-l-2 border-black/5 dark:border-white/5 min-h-[600px]">
        <div className="relative group">
          {/* Poświata zmieniająca kolor zależnie od statusu */}
          <div
            className={cn(
              "absolute inset-0 blur-[120px] rounded-full scale-150 transition-all duration-1000",
              success
                ? "bg-emerald-500/20"
                : error
                ? "bg-destructive/20"
                : "bg-primary/20"
            )}
          />

          <div className="relative z-10">
            {success ? (
              <ShieldCheck
                className="w-64 h-64 text-emerald-500 transition-all duration-700"
                strokeWidth={0.5}
              />
            ) : (
              <Fingerprint
                className={cn(
                  "w-64 h-64 text-foreground transition-all duration-700",
                  !error && "animate-pulse"
                )}
                strokeWidth={0.5}
              />
            )}
          </div>

          {/* Animowane pierścienie skanera */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-primary/20 rounded-full animate-spin-slow" />
          {!success && !error && (
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_15px_var(--primary)] animate-[scan_3s_ease-in-out_infinite]" />
          )}
        </div>

        {/* BACKGROUND DECOR */}
        <div className="absolute bottom-10 right-10 flex items-center gap-4 opacity-10 font-mono text-[10px] rotate-90 origin-right">
          <Cpu className="w-4 h-4" />
          <span>ESTABLISHING_MOLECULAR_TRUST_BRIDGE...</span>
        </div>
      </div>

      {/* Animacja skanera (dodaj do tailwind.config.js lub global.css jeśli nie masz) */}
      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            top: 0%;
            opacity: 0;
          }
          50% {
            top: 100%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NewVerificationForm;
