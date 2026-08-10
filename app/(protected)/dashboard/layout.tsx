"use client";

import { Suspense } from "react";
import DashboardSidebar from "./_components/dashboard-sidebar";
import { SidebarSkeleton } from "@/components/skeletons";
import Container from "@/components/Container";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="flex min-h-screen flex flex-col md:flex-row">
      {/* SIDEBAR - Wspólny dla wszystkich zalogowanych */}
      <aside className="w-full md:w-80 md:border-r-2 flex-shrink-0 md:sticky md:-top-10 md:h-screen">
        {/* usePathname i useCurrentRole czytają dane żądania, więc pasek boczny
            nie może być prerenderowany razem z powłoką. */}
        <Suspense fallback={<SidebarSkeleton />}>
          <DashboardSidebar />
        </Suspense>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow overflow-y-auto">
        <div className="md:p-8 xl:p-12 mx-auto">{children}</div>
      </main>
    </Container>
  );
}
