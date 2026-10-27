"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteAccount } from "@/actions/user/delete-account";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/auth/form-error";

export const DeleteAccountSection = () => {
  const t = useTranslations("dashboard.deleteAccount");
  const user = useCurrentUser();
  const readOnlyReason = useReadOnlyReason();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Administrators cannot delete themselves; the server refuses them as well.
  if (user?.role === "ADMIN" || user?.role === "DEMO_ADMIN") return null;

  const onDelete = () => {
    setError(undefined);
    startTransition(() => {
      deleteAccount(user?.isOAuth ? { email: value } : { password: value })
        .then((res) => {
          if (!res.ok) return setError(res.message);
          return signOut({ callbackUrl: "/" });
        })
        .catch(() => setError(t("failed")));
    });
  };

  return (
    <Card className="border-destructive/40">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="text-destructive" size={18} />
          <h2 className="text-lg font-semibold leading-[1.35]">{t("title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("warning")}</p>

        <div className="space-y-2">
          <Label htmlFor="delete-account-confirmation">
            {user?.isOAuth ? t("email") : t("password")}
          </Label>
          <Input
            id="delete-account-confirmation"
            type={user?.isOAuth ? "email" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="delete-account-understand"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
            disabled={isPending}
          />
          <Label htmlFor="delete-account-understand">{t("confirm")}</Label>
        </div>

        <FormError message={error} />
        {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending || !confirmed || !value || !!readOnlyReason}
          title={readOnlyReason}
        >
          {isPending ? <Loader2 className="animate-spin" /> : t("submit")}
        </Button>
      </CardContent>
    </Card>
  );
};
