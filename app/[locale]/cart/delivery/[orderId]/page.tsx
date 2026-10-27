import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { DeliveryClient } from "@/components/cart/delivery-client";
import { getOrderForDelivery, getUserAddress } from "@/lib/db-orders";

async function DeliveryPageContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getSession();
  const { orderId } = await params;
  const t = await getTranslations("delivery");

  if (!session?.user?.id) redirect("/auth/login");

  const [order, savedAddress] = await Promise.all([
    getOrderForDelivery(session.user.id, orderId),
    getUserAddress(session.user.id),
  ]);

  if (!order) notFound();

  return (
    <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
      <header className="mb-8">
        <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-balance">
          {t("title")}
        </h1>
        <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
          {t("reservation", { id: orderId })}
        </p>
      </header>

      <DeliveryClient
        order={order}
        savedAddress={savedAddress}
      />
    </div>
  );
}

export default function DeliveryPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense fallback={<FormSkeleton fields={5} />}>
      <DeliveryPageContent {...props} />
    </Suspense>
  );
}
