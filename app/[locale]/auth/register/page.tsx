import { Suspense } from "react";
import { connection } from "next/server";
import { RegisterForm } from "@/components/auth/register-form";
import { oauthProviderIds } from "@/auth.config";
import { env } from "@/lib/env";

// Env is read per request: otherwise cacheComponents bakes the build-time keys into the static shell.
const RegisterContent = async () => {
  await connection();
  return <RegisterForm oauthProviders={[...oauthProviderIds(env)]} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

const RegisterPage = () => (
  <Suspense>
    <RegisterContent />
  </Suspense>
);
export default RegisterPage;
