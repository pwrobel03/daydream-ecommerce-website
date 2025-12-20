"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const CategorySection = ({ categories }: { categories: any[] }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <section className="w-full px-4 md:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 space-y-2">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">
            Choose Your Base
          </span>
          <h2 className="text-4xl md:text-6xl font-black italic uppercase">
            Explore Worlds!
          </h2>
          <p className="italic">
            Click content to explore your favourite category
          </p>
        </div>

        <div className="flex flex-col md:flex-row h-150 w-full gap-4 overflow-hidden">
          {categories.map((category, index) => {
            const isActive = activeIndex === index;
            const flexBasis = isActive ? "flex-[5]" : "flex-[0.4]";

            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                onMouseEnter={() => setActiveIndex(index)}
                className={`relative bg-card/60 h-full transition-[flex] duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] overflow-hidden rounded-[2.5rem] group ${flexBasis} will-change-[flex]`}
              >
                {/* 1. TŁO: ZDJĘCIE */}
                {category.image && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      priority={index === 0}
                      className="object-cover transition-transform duration-1000 ease-out scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-input/90 transition-opacity duration-700 ${
                        isActive ? "opacity-0" : "opacity-40"
                      }`}
                    />
                  </div>
                )}

                {/* 2. TEKST PIONOWY */}
                <div
                  className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-500 ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <span className="md:rotate-180 md:[writing-mode:vertical-lr] font-black italic uppercase text-2xl tracking-tighter text-white/90 drop-shadow-xl select-none">
                    {category.name}
                  </span>
                </div>

                {/* 3. SZKLANY PANEL - SMOOTH TRANSITION */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 z-20">
                  <div
                    className={`bg-input/90 glass-layer border border-primary/40 rounded-[2rem] shadow-2xl relative overflow-hidden  ${
                      isActive ? "glass-layer-active" : "glass-layer-hidden"
                    }`}
                  >
                    <div className="p-8">
                      {/* <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
                        Category 0{index + 1}
                      </span> */}
                      <h3 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 text-foreground leading-none">
                        {category.name}
                      </h3>
                      <p className="text-foreground/80 text-sm mb-6 font-medium leading-relaxed max-w-[280px]">
                        {category.description}
                      </p>
                      {/* <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all duration-300">
                        Enter World <ArrowRight className="h-4 w-4" />
                      </div> */}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
