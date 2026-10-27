"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteIngredient } from "@/actions/admin/ingredients";

export const DeleteIngredientButton = ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm(t("ingredients.deleteConfirm"))) return;

    setLoading(true);
    try {
      const res = await deleteIngredient(id);
      if (!res.ok) return toast.error(res.message);
      toast.success(t("ingredients.deleted"));
    } catch {
      toast.error(t("ingredients.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onDelete}
      disabled={loading || !!readOnlyReason}
      title={readOnlyReason}
      aria-label={t("actions.delete", { name })}
      className="hover:bg-destructive hover:text-destructive-foreground"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
};
