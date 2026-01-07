import React from "react";
import SubTitle from "../sub-title";

export default function HandcraftedProcess() {
  return (
    <div className="grid grid-cols-1 gap-24 items-center py-16">
      <div className="space-y-12 flex flex-col">
        <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.8] mb-8">
          Handcrafted <br />
          <span className="text-primary">Process.</span>
        </h2>
        <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-right">
          Small Batches, <br />
          Big Impact.
        </h3>

        <div className="space-y-10">
          <div className="flex gap-6">
            <span className="text-primary font-black italic text-2xl">01.</span>
            <div>
              <h4 className="font-black uppercase italic tracking-widest text-sm mb-2">
                Raw Selection
              </h4>
              <p className="text-muted-foreground text-sm italic leading-relaxed">
                Each ingredient is hand-picked for its texture and nutritional
                profile, ensuring only the finest clusters make it into your
                bag.
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <span className="text-primary font-black italic text-2xl">02.</span>
            <div>
              <h4 className="font-black uppercase italic tracking-widest text-sm mb-2">
                Slow Roasting
              </h4>
              <p className="text-muted-foreground text-sm italic leading-relaxed">
                Our granola is baked at low temperatures to preserve
                heat-sensitive vitamins and achieve the perfect, signature
                crunch.
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            <span className="text-primary font-black italic text-2xl">03.</span>
            <div>
              <h4 className="font-black uppercase italic tracking-widest text-sm mb-2">
                Sealed Integrity
              </h4>
              <p className="text-muted-foreground text-sm italic leading-relaxed">
                Packed immediately after cooling in our high-barrier eco-pouches
                to maintain freshness and aroma from our kitchen to your table.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
