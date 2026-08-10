"use client";

import { useTranslations } from "next-intl";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteIngredient } from "@/actions/admin/ingredients"; // Twoja akcja

export const DeleteIngredientButton = ({ id }: { id: string }) => {
  const t = useTranslations("dashboard.ingredients");
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;

    setLoading(true);
    try {
      const res = await deleteIngredient(id);
      if (!res.success) return toast.error(res.error);
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(t("deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onDelete}
      disabled={loading}
      className="w-10 h-10 rounded-full border bg-card hover:text-white transition-all hover:bg-destructive text-foreground dark:bg-card dark:hover:bg-destructive"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </Button>
  );
};
