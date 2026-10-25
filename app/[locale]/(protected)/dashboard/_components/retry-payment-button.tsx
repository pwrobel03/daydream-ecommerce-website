// app/dashboard/_components/retry-payment-button.tsx
"use client";


import { useState } from "react";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { recreateStripeSession } from "@/actions/order/order";
import { toast } from "sonner"; // lub inna biblioteka do powiadomień
import { CreditCard, Loader2 } from "lucide-react";

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const t = useTranslations("demo");
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
    <button
      onClick={handleRetry}
      disabled={loading || !!readOnlyReason}
      title={readOnlyReason}
      className="w-full py-6 bg-primary text-primary-foreground rounded-full font-black italic uppercase text-lg hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          <CreditCard size={24} />
          Retry Payment
        </>
      )}
    </button>
    <p className="text-center text-sm font-medium">{t("testCard")}</p>
    </div>
  );
}
