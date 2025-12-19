import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

export default function Home() {
  return (
    <div className="bg-card border p-4 rounded-2xl hoverEffect cursor-pointer">
      <div className="aspect-square bg-accent rounded-xl mb-4">
        {/* Miejsce na zdjęcie Granoli */}
      </div>
      <h3 className="font-bold text-lg">Granola Orzechowa</h3>
      <p className="text-primary font-bold">24.90 zł</p>
    </div>
  );
}
