import { useTranslations } from "next-intl";
import { useCurrentRole } from "@/hooks/use-current-role";
import { isDemoAdmin } from "@/lib/demo";

/** The "read-only demo account" message for the demo admin, undefined for everyone else. */
export const useReadOnlyReason = () => {
  const t = useTranslations("errors");
  return isDemoAdmin(useCurrentRole()) ? t("demoReadOnly") : undefined;
};
