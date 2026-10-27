"use client";
import { useTranslations } from "next-intl";

import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NewPasswordSchema } from "@/schemas";
import { Form } from "../ui/form";
import { AuthField } from "./auth-field";
import { CardWrapper } from "./card-wrapper";
import { Button } from "../ui/button";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { useSearchParams } from "next/navigation";
import { newPassword } from "@/actions/auth/reset-password";
import { Link } from "@/i18n/navigation";

export const NewPasswordForm = () => {
  const t = useTranslations("auth.newPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });


  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    if (!token) {
      return setError(t("missingToken"));
    }
    startTransition(() => {
      newPassword(values, token).then((res) => {
        if (!res.ok) return setError(res.message);
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
          <AuthField name="password" type="password" label={t("password")} autoComplete="new-password" disabled={isPending} />
          <AuthField name="confirmPassword" type="password" label={t("confirm")} autoComplete="new-password" disabled={isPending} />
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
