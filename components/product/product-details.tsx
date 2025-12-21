// components/product/product-details.tsx
"use client";

import Image from "next/image";

export default function ProductDetails({ product }: { product: any }) {
  const mockIngredients = Array.from({ length: 12 }).map((_, i) => ({
    ...product.ingredients[i % product.ingredients.length],
    // Ważne: zmieniamy ID na unikalne dla Reacta, żeby nie sypał błędami w konsoli
    id: `mock-${i}`,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start my-16 lg:my-24 pt-16">
      {/* LEWA STRONA: Opis (Editorial Copy) */}
      <div className="w-full flex-1">
        <div className="relative flex items-center justify-center mb-12">
          {/* Sama linia */}
          <div className="absolute w-full h-px bg-border/50" />
          {/* Tekst - ważne: bg-[#fafafa] musi być identyczne z tłem Twojej strony */}
          <h3 className="text-center text-2xl wrap relative px-8 text-foreground/60 bg-background uppercase tracking-[0.5em]">
            Product Story
          </h3>
        </div>
        <p className="text-lg md:text-xl font-light leading-snug tracking-tight  italic">
          {product.description}
        </p>
      </div>

      {/* PRAWA STRONA: Składniki (Dynamic Cluster) */}
      <div className="w-full flex-1">
        <div className="relative flex items-center justify-center mb-12">
          {/* Sama linia */}
          <div className="absolute w-full h-px bg-border/50" />
          {/* Tekst - ważne: bg-[#fafafa] musi być identyczne z tłem Twojej strony */}
          <h3 className="text-center text-2xl wrap relative px-8 text-foreground/60 bg-background uppercase tracking-[0.5em]">
            Composision & Soul
          </h3>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          {product.ingredients.map((ing: any) => (
            <div
              key={ing.id}
              className="group relative w-40 h-40 bg-accent/20 rounded-[2rem] p-4 flex flex-col items-center justify-between border hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
            >
              {/* Delikatny cień/blask pod ikoną składnika */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative w-16 h-16 grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110">
                {ing.image && (
                  <Image
                    src={ing.image}
                    alt={ing.name}
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">
                  Element
                </span>
                <span className="block text-[11px] font-bold leading-tight">
                  {ing.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
