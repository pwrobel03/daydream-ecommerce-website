"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-display text-3xl tracking-tight text-balance">
        {t("somethingBroke")}
      </h2>
      <p className="max-w-md text-muted-foreground text-pretty">{t("errorHelp")}</p>
      {error.digest && (
        <p className="text-sm text-muted-foreground">
          {t("reference")}: {error.digest}
        </p>
      )}
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
