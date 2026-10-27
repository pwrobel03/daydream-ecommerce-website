import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Container from "./Container";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border bg-background py-8">
      <Container className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          {t("copyright", { year: 2026 })}. {t("demo")}
        </p>
        <Link
          href="/privacy"
          className="transition-colors duration-150 hover:text-primary-text"
        >
          {t("privacy")}
        </Link>
      </Container>
    </footer>
  );
}
