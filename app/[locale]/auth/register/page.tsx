import { RegisterForm } from "@/components/auth/register-form";
import { oauthProviderIds } from "@/auth.config";
import { env } from "@/lib/env";

const RegisterPage = () => {
  return <RegisterForm oauthProviders={[...oauthProviderIds(env)]} />;
};
export default RegisterPage;
