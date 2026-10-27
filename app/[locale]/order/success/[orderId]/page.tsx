import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function SuccessPage() {
  const t = await getTranslations("orderSuccess");

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-balance">
        {t("title")}
      </h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Link href="/" className="text-primary-text underline underline-offset-4">
        {t("back")}
      </Link>
    </div>
  );
}
