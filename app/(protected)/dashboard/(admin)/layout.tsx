import { getCurrentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { FormError } from "@/components/auth/form-error";
import { NotAllowedView } from "../_components/not-allowed-view";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const role = await getCurrentRole();

  // Sprawdzenie: Jeśli nie jest adminem
  if (role !== UserRole.ADMIN) {
    return <NotAllowedView />;
  }

  // Jeśli jest adminem, renderujemy podstrony (czyli InventoryPage)
  return <>{children}</>;
}
