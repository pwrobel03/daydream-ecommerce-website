import React from "react";
import { cn } from "@/lib/utils";

interface containerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className }: containerProps) => {
  return (
    <div className={cn("max-w-screen-xl mx-auto px-4", className)}>
      {children}
    </div>
  );
};

export default Container;
