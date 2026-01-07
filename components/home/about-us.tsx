// components/home/about-us.tsx
import SubTitle from "@/components/sub-title";
import { Wheat, Brain, Scale, Droplets } from "lucide-react";
import Image from "next/image";

export default function AboutUs() {
  return (
    <section className="pt-16 bg-background relative overflow-hidden">
      <div className="mx-auto px-6">
        {/* --- PART 1: THE FOUNDATION (The "Why") --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 mb-16">
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.8] mb-8">
              Fueling the <br />
              <span className="text-primary">Next Era.</span>
            </h2>
            <p className="text-2xl md:text-4xl font-light leading-snug tracking-tight italic text-foreground/80 max-w-3xl">
              Nexus was born from a simple realization: your morning ritual
              defines your daily performance. We don&apos;t just sell granola;
              we provide high-density nutrition for the modern achiever.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="border-l-2 border-primary pl-8 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed italic font-medium">
                We re-engineered breakfast from the ground up. By combining
                ancient grains with modern nutritional science, we created a
                collection of muesli and granolas that sustain energy levels
                without the sugar crash.
              </p>
            </div>
          </div>
        </div>

        {/* --- PART 2: QUALITY PILLARS (The "How") --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: <Wheat className="w-6 h-6" />,
              title: "Organic Grains",
              desc: "We source only premium, certified organic oats and ancient grains from sustainable farms.",
            },
            {
              icon: <Brain className="w-6 h-6" />,
              title: "Cognitive Focus",
              desc: "Infused with nuts and seeds rich in Omega-3 to support brain health and mental clarity.",
            },
            {
              icon: <Scale className="w-6 h-6" />,
              title: "Perfect Balance",
              desc: "Precisely calculated macro-nutrients to provide long-lasting satiety and steady glucose release.",
            },
            {
              icon: <Droplets className="w-6 h-6" />,
              title: "Zero Artificials",
              desc: "No refined sugars, no preservatives. Pure flavor derived from real fruits and natural spices.",
            },
          ].map((pillar, i) => (
            <div
              key={i}
              className="p-10 border rounded-[2rem] space-y-6 transition-colors group"
            >
              <div className="text-primary group-hover:scale-110 transition-transform duration-500">
                {pillar.icon}
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">
                {pillar.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
