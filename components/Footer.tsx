// components/layout/footer.tsx
import Link from "next/link";
import { Truck, Shield, Leaf, MapPin } from "lucide-react";
import Container from "./Container";

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border py-12 border-secondary bg-background/80 backdrop-blur-md transition-all">
      <Container className="max-w-7xl mx-auto px-6">
        {/* --- BUSINESS PILLARS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-6 py-12 border-y ">
          <div className="flex gap-4 items-start">
            <Truck className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-black uppercase italic tracking-tighter text-lg">
                Fast Delivery
              </h4>
              <p className="text-xs font-medium text-muted-foreground uppercase italic tracking-tight">
                Orders dispatched within 24 hours. Express shipping across EU.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <Leaf className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-black uppercase italic tracking-tighter text-lg">
                100% Organic
              </h4>
              <p className="text-xs font-medium text-muted-foreground uppercase italic tracking-tight">
                Certified organic ingredients. No artificial additives or
                sugars.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <Shield className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-black uppercase italic tracking-tighter text-lg">
                Secure Payment
              </h4>
              <p className="text-xs font-medium text-muted-foreground uppercase italic tracking-tight">
                Encrypted transactions via trusted global payment gateways.
              </p>
            </div>
          </div>
        </div>

        {/* --- NAVIGATION & LEGAL --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16">
          <div className="space-y-8">
            <div className="flex gap-8">
              <Link
                href="#"
                className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors"
              >
                Instagram
              </Link>
              <Link
                href="#"
                className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors"
              >
                Twitter
              </Link>
            </div>
          </div>

          {/* DANE FIRMOWE (Business Logic) */}
          <div className="flex flex-col items-end text-right space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest italic">
              © {currentYear} DayDream Food Archive
            </span>
            <span className="text-[9px] font-bold uppercase opacity-30 tracking-tight">
              Quality grains selected and packed in Cracow, Poland.
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
