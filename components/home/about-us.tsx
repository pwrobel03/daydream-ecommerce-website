import { Wheat, Nut, Scale, ListChecks } from "lucide-react";
import { getTranslations } from "next-intl/server";

const pillars = [
  { key: "grains", icon: Wheat },
  { key: "nuts", icon: Nut },
  { key: "balance", icon: Scale },
  { key: "simple", icon: ListChecks },
] as const;

export default async function AboutUs() {
  const t = await getTranslations("home.about");

  return (
    <section className="py-16 md:py-24">
      <h2 className="font-display text-2xl leading-tight tracking-tight text-balance">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-[65ch] text-pretty text-muted-foreground">
        {t("lead")}
      </p>
      <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ key, icon: Icon }) => (
          <li key={key} className="rounded-lg border bg-card p-6">
            <Icon className="size-6 text-primary-text" aria-hidden />
            <h3 className="mt-4 font-medium">{t(`pillars.${key}.title`)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`pillars.${key}.desc`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
