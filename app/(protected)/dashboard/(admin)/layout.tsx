import { Suspense } from "react";
import { getCurrentRole } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { NotAllowedView } from "../_components/not-allowed-view";
import { RowsSkeleton } from "@/components/skeletons";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Odczyt sesji to dane per użytkownik, więc nie da się ich prerenderować.
// Granica Suspense wokół samego guardu pozwala reszcie strony wyjść z cache,
// zamiast blokować całą trasę na czas sprawdzenia roli.
async function AdminGuard({ children }: AdminLayoutProps) {
  const role = await getCurrentRole();

  if (role !== UserRole.ADMIN) {
    return <NotAllowedView />;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
