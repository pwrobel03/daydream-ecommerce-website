import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-xl space-y-4">
        <h1 className="font-display text-4xl leading-tight tracking-tight text-balance">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-pretty">{t("body")}</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            {t("home")}
          </Link>
        </Button>
      </div>
    </main>
  );
}
