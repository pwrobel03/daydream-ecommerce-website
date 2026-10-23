"use client";

// Łapie błędy z samego layoutu głównego, więc musi renderować własne <html>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", fontStyle: "italic" }}>
            Something broke
          </h2>
          {error.digest && (
            <p style={{ opacity: 0.5, fontSize: "0.75rem", letterSpacing: "0.2em" }}>
              Reference: {error.digest}
            </p>
          )}
          <button onClick={reset} style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", borderRadius: 999, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
