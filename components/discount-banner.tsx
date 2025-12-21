"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

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
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!sales || sales.length === 0) return null;

  return (
    <section className="w-full sm:px-4 md:px-8 mt-20 mb-10">
      <Carousel
        plugins={[plugin.current]}
        className="w-full max-w-7xl mx-auto relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-card/60"
      >
        <CarouselContent>
          {sales.map((sale) => (
            <CarouselItem
              key={sale.id}
              className="relative min-h-[500px] md:min-h-[600px]"
            >
              {/* WARSTWA OBRAZU: 70% SZEROKOŚCI OD PRAWEJ */}
              {sale.image && (
                <div className="absolute right-0 top-0 bottom-0 w-full md:w-[70%] z-0">
                  <Image
                    src={sale.image}
                    alt={sale.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, 70vw"
                  />
                  {/* Gradient maskujący, by obrazek "wtapiał się" w szklany panel */}
                  <div className="absolute inset-0 from-accent/20 via-transparent to-transparent hidden md:block" />
                </div>
              )}

              {/* TREŚĆ: SZKLANY PANEL NACHODZĄCY NA OBRAZ */}
              <div className="relative z-10 h-full w-full flex items-stretch">
                <div className="w-full md:w-[50%] lg:w-[45%] p-8 md:p-16 flex flex-col justify-center bg-background/60 backdrop-blur-xs border-r border-white/20 shadow-2xl">
                  <div className="space-y-6">
                    <Badge
                      variant="outline"
                      className="bg-primary/20 text-primary border-primary/30 py-1.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-black w-fit backdrop-blur-md"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Limited Time Offer
                    </Badge>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-[0.9] text-foreground">
                      {sale.name}
                    </h2>

                    {sale.description && (
                      <p className="text-foreground/80 text-base md:text-xl leading-relaxed max-w-md font-medium">
                        {sale.description}
                      </p>
                    )}

                    {/* TAG KODU */}
                    <div className="flex flex-wrap items-center gap-6 pt-4">
                      <div className="relative overflow-hidden bg-background/80 backdrop-blur-md border-2 border-dashed border-primary/40 px-6 py-3 rounded-2xl flex flex-col shadow-xl">
                        <span className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-widest text-center">
                          Promo Code
                        </span>
                        <span className="text-3xl font-mono font-black text-primary tracking-tight italic">
                          {sale.couponCode}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-5xl font-black text-foreground leading-none">
                          -{sale.discountValue}%
                        </span>
                        <span className="text-xs uppercase font-bold text-primary tracking-widest text-center">
                          Discount
                        </span>
                      </div>
                    </div>

                    <div className="pt-8">
                      <Button
                        size="lg"
                        className="h-14 rounded-full px-10 hoverEffect font-bold uppercase tracking-widest text-xs group/btn shadow-xl shadow-primary/30"
                      >
                        <ShoppingBag className="mr-3 h-5 w-5" />
                        Explore Collection
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* KONTROLKI: KOLOR SECONDARY (SZAŁWIA) + SZKŁO */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex gap-3 z-30">
          <CarouselPrevious className="static h-14 w-14 translate-y-0 translate-x-0 bg-accent/40 text-accent-foreground border-accent/30 backdrop-blur-2xl hover:bg-accent hover:text-accent-foreground transition-all shadow-2xl" />
          <CarouselNext className="static h-14 w-14 translate-y-0 translate-x-0 bg-accent/40 text-accent-foreground border-accent/30 backdrop-blur-2xl hover:bg-accent hover:text-accent-foreground transition-all shadow-2xl" />
        </div>
      </Carousel>
    </section>
  );
};

export default DiscountBanner;
