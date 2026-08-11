"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    // Szczegóły zostają na serwerze; klient dostaje wyłącznie digest.
    console.error("Unhandled error", error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h2 className="text-3xl font-black uppercase italic tracking-tighter">
        {t("somethingBroke")}
      </h2>
      <p className="max-w-md text-sm opacity-70">
        {t("errorHelp")}
      </p>
      {error.digest && (
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
          {t("reference")}: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-full bg-foreground px-10 py-4 text-sm font-black uppercase italic tracking-widest text-background"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
