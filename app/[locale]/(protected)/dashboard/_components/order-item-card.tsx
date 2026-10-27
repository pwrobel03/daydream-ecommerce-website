import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import PriceFormatter from "@/components/PriceFormatter";
import { Link } from "@/i18n/navigation";
import type { UserOrderItem } from "@/lib/db-orders";

export const OrderItemCard = ({ item }: { item: UserOrderItem }) => {
  const t = useTranslations("dashboard.orderDetail");

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border sm:size-20">
        {item.product.images?.[0]?.url ? (
          <Image
            src={item.product.images[0].url}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageIcon size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <Link
          href={`/product/${item.product.slug}`}
          className="block font-medium break-words hover:underline"
        >
          {item.product.name}
        </Link>
        <p className="flex flex-wrap gap-x-1 text-sm text-muted-foreground tabular-nums">
          <span>{t("quantity", { count: item.quantity })}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex gap-1">
            <PriceFormatter amount={Number(item.price)} className="font-normal text-muted-foreground" />
            {t("each")}
          </span>
        </p>
      </div>

      <PriceFormatter
        amount={Number(item.price) * item.quantity}
        className="shrink-0 tabular-nums"
      />
    </div>
  );
};
