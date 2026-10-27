"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { recreateStripeSession } from "@/actions/order/order";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const t = useTranslations("demo");
  const tOrder = useTranslations("dashboard.orderDetail");
  const readOnlyReason = useReadOnlyReason();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    const res = await recreateStripeSession(orderId);

    if (!res.ok) {
      toast.error(res.message);
      setLoading(false);
      return;
    }

    window.location.assign(res.data.url);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRetry}
        disabled={loading || !!readOnlyReason}
        title={readOnlyReason}
        className="w-full"
      >
        {loading ? <Loader2 className="animate-spin" /> : <CreditCard />}
        {tOrder("retryPayment")}
      </Button>
      <p className="text-sm text-muted-foreground">{t("testCard")}</p>
    </div>
  );
}
