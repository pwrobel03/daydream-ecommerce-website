import { CardWrapper } from "./card-wrapper";
export const LoginForm = () => {
  return (
    <CardWrapper
      headerLabel="Welcome back"
      backButtonHref="/auth/register"
      backButtonLabel="Don't have an account?"
      showSocial
    >
      <div>Login Form!</div>
    </CardWrapper>
  );
};
