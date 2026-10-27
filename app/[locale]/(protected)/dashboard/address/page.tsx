import { FormSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getUserAddress } from "@/lib/db-orders";
import { redirect } from "next/navigation";
import { AddressForm } from "../_components/address-form";
import { getTranslations } from "next-intl/server";

async function AddressPageContent() {
  const t = await getTranslations("dashboard");
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/login");

  const address = await getUserAddress(session.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight">
          {t("labels.deliveryAddress")}
        </h1>
        <p className="text-muted-foreground">{t("address.subtitle")}</p>
      </header>

      <AddressForm initialData={address} />
    </div>
  );
}

export default function AddressPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <AddressPageContent />
    </Suspense>
  );
}
