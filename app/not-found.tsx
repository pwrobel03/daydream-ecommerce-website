// app/not-found.tsx
import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        {/* DUŻY NUMER W TLE */}
        <div className="relative">
          <span className="absolute -top-20 -left-10 text-[15rem] md:text-[25rem] font-black italic text-accent/5 select-none pointer-events-none">
            404
          </span>

          {/* TREŚĆ */}
          <div className="relative z-10 bg-background/80 backdrop-blur-xl border border-border p-10 md:p-20 rounded-[3rem] shadow-2xl">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-4 block">
              Lost in a dream?
            </span>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-8">
              This world <br /> doesn't exist.
            </h1>
            <p className="text-muted-foreground text-lg font-medium mb-12 max-w-md leading-relaxed">
              The path you're looking for has vanished into the morning mist.
              Let's get you back to your breakfast.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:gap-6 transition-all duration-300 shadow-lg shadow-primary/20"
            >
              <MoveLeft className="h-4 w-4" />
              Back to Reality
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
