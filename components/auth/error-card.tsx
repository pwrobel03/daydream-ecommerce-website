import { useTranslations } from "next-intl";
import { Header } from "./header";
import { BackButton } from "./back-button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

export const ErrorCard = () => {
  const t = useTranslations("auth.error");
  return (
    <Card className="w-100 shadow-md">
      <CardHeader>
        <Header label={t("title")} />
      </CardHeader>
      <CardContent>
        <p className="text-center text-red-600">
          {t("invalidKey")}
        </p>
      </CardContent>
      <CardFooter>
        <BackButton label={t("back")} href="/auth/login" />
      </CardFooter>
    </Card>
  );
};
