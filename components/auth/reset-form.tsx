"use client";
import { useTranslations } from "next-intl";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ResetPasswordSchema } from "@/schemas";
import { Form } from "../ui/form";
import { AuthField } from "./auth-field";
import { CardWrapper } from "./card-wrapper";
import { Button } from "../ui/button";
import { TurnstileWidget } from "./turnstile-widget";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { resetPassword } from "@/actions/auth/reset-password";
import { Link } from "@/i18n/navigation";

export const ResetForm = ({ turnstileSiteKey }: { turnstileSiteKey: string }) => {
  const t = useTranslations("auth.reset");
  const tAuth = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [widgetKey, setWidgetKey] = useState(0);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
      turnstileToken: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      resetPassword(values).then((res) => {
        // Token jest jednorazowy — każda próba wymaga nowego wyzwania.
        form.setValue("turnstileToken", "");
        setWidgetKey((k) => k + 1);
        if (!res.ok) return setError(
          res.code === "EMAIL_NOT_SENT" ? tAuth("mailNotSent")
            : res.code === "TURNSTILE_FAILED" ? tAuth("turnstileFailed")
            : res.message
        );
        setSuccess(t("success"));
      });
    });
  };

  return (
    <CardWrapper
      title={t("title")}
      description={t("description")}
      footer={
        <Link href="/auth/login" className="text-primary-text underline underline-offset-4">
          {t("backToLogin")}
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AuthField name="email" type="email" label={t("email")} autoComplete="email" placeholder={t("emailPlaceholder")} disabled={isPending} />
          <div className="space-y-2">
            <TurnstileWidget
              key={widgetKey}
              siteKey={turnstileSiteKey}
              onToken={(token) => form.setValue("turnstileToken", token, { shouldValidate: form.formState.isSubmitted })}
            />
            {form.formState.errors.turnstileToken && (
              <p role="alert" className="text-destructive text-sm">{tAuth("turnstileFailed")}</p>
            )}
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full">
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
