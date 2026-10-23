import { setRequestLocale } from "next-intl/server";
import { ErrorCard } from "@/components/auth/error-card";

export default async function AuthErrorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // ErrorCard jest komponentem serwerowym i sięga po tłumaczenia. Bez
  // zadeklarowania języka liczy się to jako dane żądania i strona przestaje
  // być prerenderowalna — mimo że nie zależy od niczego poza językiem.
  const { locale } = await params;
  setRequestLocale(locale);

  return <ErrorCard />;
}
