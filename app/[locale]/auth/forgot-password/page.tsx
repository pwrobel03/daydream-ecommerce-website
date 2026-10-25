import { Suspense } from "react";
import { connection } from "next/server";
import { ResetForm } from "@/components/auth/reset-form";
import { env } from "@/lib/env";

// Env is read per request: otherwise cacheComponents bakes the build-time key into the static shell.
const ResetContent = async () => {
  await connection();
  return <ResetForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

const ForgotPasswordPage = () => (
  <Suspense>
    <ResetContent />
  </Suspense>
);

export default ForgotPasswordPage;
