"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { Edit3, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/admin/inventory";
import PriceFormatter from "@/components/PriceFormatter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "@/lib/db-inventory";

export function InventoryList({ products }: { products: InventoryProduct[] }) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(t("inventory.deleteConfirm", { name }))) return;

    startTransition(async () => {
      const res = await deleteProduct(id);
      // Wcześniej nieudane usunięcie nie dawało żadnego sygnału.
      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(t("feedback.productRemoved"));
      // Lista pochodzi z serwera, więc odświeżamy ją zamiast trzymać kopię.
      router.refresh();
    });
  };

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {t("inventory.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {products.map((product) => (
        <li
          key={product.id}
          className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 transition-colors duration-150 ease-out hover:bg-accent"
        >
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <ImageIcon
                aria-hidden
                className="absolute inset-0 m-auto size-6 text-muted-foreground"
              />
            )}
          </div>

          <div className="flex min-w-48 flex-1 flex-col gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="line-clamp-2 break-words font-medium hover:underline"
            >
              {product.name}
            </Link>
            <div className="flex flex-wrap gap-2">
              {product.categories.map((cat) => (
                <Badge key={cat.id} variant="outline">
                  {cat.name}
                </Badge>
              ))}
              {product.status && (
                <Badge variant="secondary">{product.status.name}</Badge>
              )}
            </div>
          </div>

          <dl className="flex items-center gap-6 tabular-nums">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t("inventory.price")}</dt>
              <dd className="font-medium">
                <PriceFormatter
                  amount={product.promoPrice || product.price}
                  className="font-medium"
                />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t("inventory.stock")}</dt>
              <dd
                className={cn(
                  "font-medium",
                  product.stock <= 5 && "text-destructive"
                )}
              >
                {product.stock}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/dashboard/inventory/${product.id}`)}
              aria-label={t("actions.edit", { name: product.name })}
            >
              <Edit3 />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(product.id, product.name)}
              disabled={isPending || !!readOnlyReason}
              title={readOnlyReason}
              aria-label={t("actions.delete", { name: product.name })}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
