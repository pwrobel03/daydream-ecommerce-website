"use client";
import { useTranslations } from "next-intl";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { Form } from "../ui/form";
import { AuthField } from "./auth-field";
import { CardWrapper } from "./card-wrapper";
import { Button } from "../ui/button";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { login } from "@/actions/auth/login";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Social } from "./social";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo";

type OAuthProvider = "google" | "github";

export const LoginForm = ({ oauthProviders = [] }: { oauthProviders?: OAuthProvider[] }) => {
  const t = useTranslations("auth.login");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signInAsDemoAdmin = () =>
    onSubmit({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const data = await login(values);
      if (!data.ok) return setError(data.code === "EMAIL_NOT_SENT" ? tAuth("mailNotSent") : data.message);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.code === "rate_limited") {
        setError(t("rateLimited"));
      } else if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        setSuccess(t("success"));
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <CardWrapper
      title={t("title")}
      description={t("description")}
      footer={
        <p className="text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="text-primary-text underline underline-offset-4">
            {t("register")}
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AuthField name="email" type="email" label={t("email")} autoComplete="email" placeholder={t("emailPlaceholder")} disabled={isPending} />
          <AuthField
            name="password"
            type="password"
            label={t("password")}
            autoComplete="current-password"
            disabled={isPending}
            labelAside={
              <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
                {t("forgot")}
              </Link>
            }
          />
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full">
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Form>

      <Social providers={oauthProviders} />

      <section className="space-y-3 border-t pt-6 text-sm">
        <h2 className="font-medium">{t("demoTitle")}</h2>
        <p className="text-muted-foreground break-words">
          {t("demoEmail")}: <code>{DEMO_ADMIN_EMAIL}</code>
          <br />
          {t("demoPassword")}: <code>{DEMO_ADMIN_PASSWORD}</code>
        </p>
        <Button type="button" variant="outline" disabled={isPending} onClick={signInAsDemoAdmin}>
          {t("demoSignIn")}
        </Button>
      </section>
    </CardWrapper>
  );
};
