interface ProductProps {
  name: string;
  color: string;
  className?: string;
}
import { cn } from "@/lib/utils";

import React from "react";

const ProductStatusBadge = ({ name, color, className }: ProductProps) => {
  if (!name) return null;
  return (
    <div
      style={{ backgroundColor: color || "var(--secondary)" }}
      className={cn(
        "text-md px-6 py-4 rounded-full shadow-lg flex items-center justify-center w-fit",
        className
      )}
    >
      <span
        className={cn(
          "font-black uppercase tracking-[0.2em] leading-none",
          // Tło domyślne to --secondary, które w obu motywach wymaga ciemnego tekstu.
          color ? "text-white" : "text-secondary-foreground"
        )}
      >
        {name}
      </span>
    </div>
  );
};

export default ProductStatusBadge;
