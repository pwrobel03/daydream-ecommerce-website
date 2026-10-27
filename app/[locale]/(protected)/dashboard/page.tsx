import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Package, MapPin, UserCog } from "lucide-react";

async function DashboardPageContent() {
  const t = await getTranslations("dashboard");
  const session = await getSession();
  // Nazwa bywa pusta albo bardzo długa — pierwszy człon, a bez niego samo powitanie.
  const firstName = session?.user?.name?.trim().split(/\s+/)[0];

  const orderCount = await db.order.count({
    where: { userId: session?.user?.id },
  });

  const cards = [
    {
      title: t("nav.orders"),
      description: t("tiles.ordersDesc"),
      href: "/dashboard/orders",
      icon: Package,
      count: t("overview.orderCount", { count: orderCount }),
    },
    {
      title: t("nav.address"),
      description: t("tiles.addressDesc"),
      href: "/dashboard/address",
      icon: MapPin,
    },
    {
      title: t("nav.profile"),
      description: t("tiles.profileDesc"),
      href: "/dashboard/profile",
      icon: UserCog,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight break-words">
          {firstName
            ? t("overview.greeting", { name: firstName })
            : t("overview.greetingNoName")}
        </h1>
        <p className="max-w-prose text-muted-foreground">{t("overview.intro")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-3 rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
          >
            <card.icon size={20} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold leading-[1.35]">{card.title}</h2>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
            {card.count && <p className="mt-auto text-sm font-medium">{card.count}</p>}
          </Link>
        ))}
      </div>

      <Link href="/" className="inline-block text-sm underline underline-offset-4">
        {t("overview.backToStore")}
      </Link>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Deklaracja języka w powłoce — bez niej pobranie tłumaczeń wewnątrz
  // Suspense i tak wciąga całą trasę w tryb dynamiczny.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<RowsSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
