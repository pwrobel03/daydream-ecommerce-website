import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Persistent, non-dismissible banner: Daydream is a portfolio demo (ADR 0006). */
export async function DemoNotice() {
  const t = await getTranslations("demo");

  return (
    <div
      role="note"
      className="bg-muted text-foreground px-4 py-2 text-center text-sm"
    >
      {t("notice")}{" "}
      <Link href="/privacy" className="underline underline-offset-4">
        {t("privacyLink")}
      </Link>
    </div>
  );
}
