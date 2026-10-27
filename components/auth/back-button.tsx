"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "../ui/button";

interface BackButtonProps {
  label: string;
  href: string;
}

export const BackButton = ({ label, href }: BackButtonProps) => {
  return (
    <Button variant="link" className="h-auto p-0" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
};
