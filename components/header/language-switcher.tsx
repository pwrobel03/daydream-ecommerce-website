"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // usePathname z i18n/navigation zwraca ścieżkę BEZ prefiksu języka,
  // więc replace na tej samej ścieżce z inną lokalizacją zachowuje miejsce.
  function switchTo(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
      <Languages aria-hidden="true" className="h-4 w-4 opacity-40" />
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          disabled={isPending || code === locale}
          aria-current={code === locale ? "true" : undefined}
          className={
            code === locale
              ? "px-2 text-[10px] font-black uppercase tracking-widest"
              : "px-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}
