"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SaleHeroProps {
  sales: {
    id: string;
    name: string;
    description: string | null;
    couponCode: string;
    discountValue: number;
    image: string | null;
  }[];
}

const DiscountBanner = ({ sales }: SaleHeroProps) => {
  const t = useTranslations("home.sale");

  if (!sales || sales.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <Carousel className="relative w-full overflow-hidden rounded-lg border bg-card">
        <CarouselContent>
          {sales.map((sale) => (
            <CarouselItem
              key={sale.id}
              className="flex min-h-[500px] flex-col md:min-h-[480px] md:flex-row"
            >
              <div className="flex flex-1 flex-col justify-center gap-6 p-6 md:p-12">
                <h2 className="font-display text-3xl leading-tight tracking-tight wrap-anywhere text-balance">
                  {sale.name}
                </h2>
                {sale.description && (
                  <p className="max-w-[65ch] text-pretty text-muted-foreground">
                    {sale.description}
                  </p>
                )}
                <div className="flex flex-wrap items-end gap-8">
                  <p className="text-sm text-muted-foreground">
                    {t("code")}
                    <span className="block font-mono text-2xl font-semibold text-foreground wrap-anywhere">
                      {sale.couponCode}
                    </span>
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {t("discount", { value: sale.discountValue })}
                  </p>
                </div>
                <Button asChild size="lg" className="w-fit">
                  <Link href="/category/all">
                    {t("cta")}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>

              {sale.image && (
                <div className="relative h-64 w-full md:h-auto md:w-1/2">
                  <Image
                    src={sale.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>

        {sales.length > 1 && (
          <div className="absolute bottom-4 left-4 flex gap-2 md:left-12">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        )}
      </Carousel>
    </section>
  );
};

export default DiscountBanner;
