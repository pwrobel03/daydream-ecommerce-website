"use client";

import DashboardSidebar from "./_components/dashboard-sidebar";
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
        <DashboardSidebar />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow overflow-y-auto">
        <div className="p-4 md:p-8 xl:p-12 mx-auto">{children}</div>
      </main>
    </Container>
  );
}
