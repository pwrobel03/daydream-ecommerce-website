"use client";

import { ChevronRight, Image as ImageIcon, Trash2 } from "lucide-react";
import { deleteCategory } from "@/actions/admin/categories";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CategoryListItem } from "@/lib/db-inventory";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CategoryListProps {
  initialCategories: CategoryListItem[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const router = useRouter();

  // Lista przychodzi z Server Componentu, a router.refresh() dostarcza nową —
  // kopiowanie jej do stanu i dosynchronizowywanie efektem nic nie wnosiło
  // poza dodatkowym renderem po każdym odświeżeniu.
  const categories = initialCategories;

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("categories.deleteConfirm", { name }))) return;

    const res = await deleteCategory(id);
    if (!res.ok) return toast.error(res.message);

    toast.success(t("feedback.categoryRemoved"));
    // Odświeżamy dane globalnie
    router.refresh();
  };

  const deleteButton = (id: string, name: string) => (
    <Button
      variant="outline"
      size="icon"
      onClick={() => handleDelete(id, name)}
      disabled={!!readOnlyReason}
      title={readOnlyReason}
      aria-label={t("actions.delete", { name })}
      className="shrink-0 hover:bg-destructive hover:text-destructive-foreground"
    >
      <Trash2 />
    </Button>
  );

  const mainCategories = categories.filter((c) => !c.parentId);

  if (mainCategories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {t("categories.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {mainCategories.map((main) => {
        const children = categories.filter((c) => c.parentId === main.id);

        return (
          <li key={main.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {main.image ? (
                  <Image
                    src={main.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon
                    aria-hidden
                    className="absolute inset-0 m-auto size-5 text-muted-foreground"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="line-clamp-2 break-words font-medium">
                  {main.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{t("categories.main")}</Badge>
                  <span>
                    {t("categories.products", { count: main._count.products })}
                  </span>
                </div>
              </div>
              {deleteButton(main.id, main.name)}
            </div>

            {children.length > 0 && (
              <ul className="ml-6 flex flex-col gap-2 border-l pl-4">
                {children.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <ChevronRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="line-clamp-2 break-words font-medium">
                        {sub.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("categories.products", {
                          count: sub._count.products,
                        })}
                      </p>
                    </div>
                    {deleteButton(sub.id, sub.name)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
