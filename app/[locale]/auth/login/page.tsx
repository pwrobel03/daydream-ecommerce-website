import { LoginForm } from "@/components/auth/login-form";
import { oauthProviderIds } from "@/auth.config";
import { env } from "@/lib/env";

const LoginPage = () => {
  return <LoginForm oauthProviders={[...oauthProviderIds(env)]} />;
};
export default LoginPage;
