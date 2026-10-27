"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/user/settings";
import { useCurrentUser } from "@/hooks/use-current-user";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { Loader2 } from "lucide-react";
import { DeleteAccountSection } from "@/components/user/delete-account-section";

const SettingsPage = () => {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const user = useCurrentUser();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user?.name || undefined,
      email: user?.email || undefined,
      password: undefined,
      newPassword: undefined,
    },
  });

  // Naprawa błędu "weird redirect": Resetujemy formularz, gdy sesja się załaduje
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || undefined,
        email: user.email || undefined,
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      settings(values)
        .then((res) => {
          if (!res.ok) return setError(res.message);
          update(); // Odświeża sesję klienta
          setSuccess(
            res.data.emailChanged
              ? t(res.data.emailSent ? "feedback.emailChanged" : "feedback.emailNotSent")
              : t("feedback.settingsSaved")
          );
        })
        .catch(() => setError(t("feedback.transmissionError")));
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground">{t("profile.subtitle")}</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold leading-[1.35]">{t("profile.details")}</h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.name")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.email")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending || user?.isOAuth}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {user?.isOAuth !== true && (
            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-lg font-semibold leading-[1.35]">{t("profile.password")}</h2>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.currentPassword")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.newPassword")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <FormError message={error} />
          <FormSuccess message={success} />

          {readOnlyReason && <p className="text-sm text-muted-foreground">{readOnlyReason}</p>}
          <Button disabled={isPending || !!readOnlyReason} title={readOnlyReason} type="submit">
            {isPending ? <Loader2 className="animate-spin" /> : t("labels.update")}
          </Button>
        </form>
      </Form>

      <DeleteAccountSection />
    </div>
  );
};

export default SettingsPage;
