import { getTranslations } from "next-intl/server";

const steps = ["select", "roast", "pack"] as const;

export default async function HandcraftedProcess() {
  const t = await getTranslations("home.process");

  return (
    <section className="py-16 md:py-24">
      <h2 className="font-display text-2xl leading-tight tracking-tight text-balance">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-[65ch] text-pretty text-muted-foreground">
        {t("lead")}
      </p>
      {/* The steps happen in this order, so the list is numbered. */}
      <ol className="mt-12 max-w-[65ch] space-y-8">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-6">
            <span className="font-display text-2xl tabular-nums text-primary-text">
              {i + 1}
            </span>
            <div>
              <h3 className="font-medium">{t(`steps.${step}.title`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`steps.${step}.desc`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
