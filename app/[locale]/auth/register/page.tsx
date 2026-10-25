import { RegisterForm } from "@/components/auth/register-form";
import { oauthProviderIds } from "@/auth.config";
import { env } from "@/lib/env";

const RegisterPage = () => {
  return <RegisterForm oauthProviders={[...oauthProviderIds(env)]} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};
export default RegisterPage;
