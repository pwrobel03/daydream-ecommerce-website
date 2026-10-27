import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export const NotAllowedView = async () => {
  const t = await getTranslations("dashboard.notAllowed");

  return (
    <div className="flex max-w-xl flex-col items-start gap-4 py-12">
      <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
      <p>{t("description")}</p>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">
          <ArrowLeft aria-hidden />
          {t("back")}
        </Link>
      </Button>
    </div>
  );
};
