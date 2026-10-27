"use client";
import { useTranslations } from "next-intl";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { newVerification } from "@/actions/auth/verify-email";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { CardWrapper } from "./card-wrapper";

const NewVerificationForm = () => {
  const t = useTranslations("auth.verification");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError(t("missingToken"));
      return;
    }

    newVerification(token)
      .then((res) => {
        if (!res.ok) return setError(res.message);
        setSuccess(t("success"));
      })
      .catch(() => {
        setError(t("failed"));
      });
  }, [token, success, error, t]);

  // Weryfikacja tokenu musi wystartować po zamontowaniu — nie ma tu zdarzenia
  // użytkownika, na którym dałoby się to zawiesić.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper title={t("title")}>
      {!success && !error && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
          <Loader2 className="size-4 animate-spin" />
          {t("pending")}
        </p>
      )}
      <FormError message={error || undefined} />
      <FormSuccess message={success || undefined} />
      <Button asChild variant={success ? "default" : "outline"}>
        <Link href="/auth/login">{success ? t("proceed") : t("back")}</Link>
      </Button>
    </CardWrapper>
  );
};

export default NewVerificationForm;
