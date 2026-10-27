import { useTranslations } from "next-intl";
import { BackButton } from "./back-button";
import { CardWrapper } from "./card-wrapper";

export const ErrorCard = () => {
  const t = useTranslations("auth.error");
  return (
    <CardWrapper
      title={t("title")}
      description={t("invalidKey")}
      footer={<BackButton label={t("back")} href="/auth/login" />}
    />
  );
};
