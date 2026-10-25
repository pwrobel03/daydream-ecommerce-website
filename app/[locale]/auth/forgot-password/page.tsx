import { ResetForm } from "@/components/auth/reset-form";
import { env } from "@/lib/env";
const ForgotPasswordPage = () => {
  return <ResetForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

export default ForgotPasswordPage;
