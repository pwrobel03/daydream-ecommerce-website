import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/components/Container";
import { env } from "@/lib/env";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return { title: t("title") };
}

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

// Kolejność jak w ADR 0013; `items` to lista punktów, `body` akapit.
const sections = [
  { id: "controller", kind: "body" },
  { id: "data", kind: "items" },
  { id: "purposes", kind: "items" },
  { id: "retention", kind: "items" },
  { id: "rights", kind: "body" },
  { id: "recipients", kind: "items" },
  { id: "admin", kind: "body" },
  { id: "cookies", kind: "body" },
] as const;

async function PrivacyContent() {
  // Dane administratora czytamy przy każdym żądaniu, nie przy budowaniu obrazu.
  await connection();

  const t = await getTranslations("privacy");
  const values = {
    name: env.PRIVACY_CONTROLLER_NAME,
    email: env.PRIVACY_CONTACT_EMAIL,
    provider: env.PRIVACY_EMAIL_PROVIDER,
  };

  return (
    <Container className="max-w-3xl py-12 space-y-8">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter">
        {t("title")}
      </h1>
      <p>{t("intro")}</p>
      {sections.map(({ id, kind }) => (
        <section key={id} className="space-y-3">
          <h2 className="text-xl font-bold">{t(`sections.${id}.heading`)}</h2>
          {kind === "body" ? (
            <p>{t(`sections.${id}.body`, values)}</p>
          ) : (
            <ul className="list-disc space-y-2 pl-6">
              {Object.keys(t.raw(`sections.${id}.items`)).map((key) => (
                <li key={key}>{t(`sections.${id}.items.${key}`, values)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </Container>
  );
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <PrivacyContent />
    </Suspense>
  );
}
