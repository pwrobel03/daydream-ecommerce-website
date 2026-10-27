"use client";

import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

// Łapie błędy z samego layoutu głównego, więc nie ma providera next-intl ani
// znanego języka — pokazujemy oba (wspólne klucze z `common`).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 600 }}>
            {en.common.somethingBroke} / <span lang="pl">{pl.common.somethingBroke}</span>
          </h2>
          {error.digest && (
            <p style={{ opacity: 0.7, fontSize: "0.875rem" }}>
              {en.common.reference}: {error.digest}
            </p>
          )}
          <button onClick={reset} style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", borderRadius: 6, cursor: "pointer" }}>
            {en.common.tryAgain} / <span lang="pl">{pl.common.tryAgain}</span>
          </button>
        </div>
      </body>
    </html>
  );
}
