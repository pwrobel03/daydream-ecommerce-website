import Link from "next/link";
import { ShieldBan, ArrowLeft, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

export const NotAllowedView = () => {
  return (
    <div className="container mx-auto flex flex-col justify-center">
      {/* --- NAGŁÓWEK --- */}
      <header className="mb-16 space-y-6">
        <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black italic uppercase tracking-tighter leading-none">
          Access <span className="text-destructive">Denied</span>
        </h1>
        <div className="border-l-4 border-destructive pl-8 py-2">
          <p className="text-xl md:text-2xl font-bold italic tracking-tight text-balance leading-relaxed">
            You do not have the required clearance to view this
            <span className="text-destructive"> artifact</span>. This area is
            restricted to authorized personnel only.
          </p>
        </div>
      </header>

      {/* --- KARTA INFORMACYJNA (Stylizowana jak w Dashboard) --- */}
      <div className="group relative bg-card/60 border rounded-[3rem] p-10 md:p-16 overflow-hidden max-w-4xl mx-auto w-full transition-all hover:shadow-2xl ">
        {/* Dekoracyjne tło ikony */}
        <div
          className={cn(
            "absolute -right-10 -top-10 w-64 h-64 opacity-5 text-destructive transition-transform group-hover:scale-110 group-hover:-rotate-12",
            "flex items-center justify-center pointer-events-none"
          )}
        >
          <ShieldBan size={250} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start md:items-center justify-between gap-12">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-destructive text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
              <LockKeyhole size={32} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.4em] opacity-60 mb-2">
                Security Protocol 403
              </p>
              <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                Restricted Zone
              </h3>
              <p className="text-lg font-bold opacity-40 uppercase tracking-tight mt-4 max-w-md">
                Please contact your administrator if you believe this is an
                error within the matrix.
              </p>
            </div>
          </div>

          {/* Przycisk powrotu */}
          <Link
            href="/dashboard"
            className="group/btn flex items-center gap-4 px-10 py-6 bg-foreground text-background rounded-full font-black uppercase italic hover:bg-destructive hover:text-white transition-all whitespace-nowrap"
          >
            <ArrowLeft className="transition-transform group-hover/btn:-translate-x-1" />
            Return Safely
          </Link>
        </div>
      </div>
    </div>
  );
};
