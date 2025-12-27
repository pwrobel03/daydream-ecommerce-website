// app/dashboard/_components/retry-payment-button.tsx
"use client";

import { useState } from "react";
import { recreateStripeSession } from "@/actions/order";
import { toast } from "sonner"; // lub inna biblioteka do powiadomień
import { CreditCard, Loader2 } from "lucide-react";

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    const res = await recreateStripeSession(orderId);

    if (res.url) {
      window.location.assign(res.url);
    } else {
      toast.error(res.error || "Payment session error");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="w-full py-6 bg-primary text-white rounded-full font-black italic uppercase text-lg hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
  );
}
