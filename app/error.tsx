"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Szczegóły zostają na serwerze; klient dostaje wyłącznie digest.
    console.error("Unhandled error", error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h2 className="text-3xl font-black uppercase italic tracking-tighter">
        Something broke
      </h2>
      <p className="max-w-md text-sm opacity-60">
        This one is on us. The error has been logged.
      </p>
      {error.digest && (
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-full bg-foreground px-10 py-4 text-sm font-black uppercase italic tracking-widest text-background"
      >
        Try again
      </button>
    </div>
  );
}
