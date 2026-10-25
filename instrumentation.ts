// Validate the environment at server startup (ADR 0005): a live Stripe key must stop the
// process instead of surfacing as a 500 on every request. Next.js only logs a throwing
// register() and keeps serving, so the process exits explicitly.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      await import("@/lib/env");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}
