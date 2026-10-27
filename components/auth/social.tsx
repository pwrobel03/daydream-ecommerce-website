"use client";

import { useTranslations } from "next-intl";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

const ICONS = { google: FcGoogle, github: FaGithub };
type Provider = keyof typeof ICONS;

// Renders nothing, divider included, when no provider is registered.
export const Social = ({ providers }: { providers: Provider[] }) => {
  const t = useTranslations("auth.oauth");
  if (providers.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-center text-sm">
        {t("divider")}
      </p>
      <div className="flex items-center gap-x-2 w-full">
        {providers.map((provider) => {
          const Icon = ICONS[provider];
          return (
            <Button
              key={provider}
              type="button"
              className="flex-1"
              size="lg"
              variant="outline"
              aria-label={t(provider)}
              onClick={() => signIn(provider, { callbackUrl: "/auth/login" })}
            >
              <Icon className="h-5 w-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
