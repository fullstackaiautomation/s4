import { ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardFiltersProvider } from "@/components/providers/dashboard-filters";
import { requireAuthContext } from "@/lib/auth/session";

export const dynamic = 'force-dynamic';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = await requireAuthContext();

  return (
    <DashboardFiltersProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar role={auth.role} userEmail={auth.user.email ?? ""} />
        <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-transparent px-4 pt-4 sm:px-6 lg:hidden">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Source 4
              </span>
              <span className="text-lg font-semibold">Operations Console</span>
            </div>
            <MobileNav role={auth.role} />
          </div>
          <main className="flex-1 overflow-y-auto px-4 py-12 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-16">{children}</div>
          </main>
        </div>
      </div>
    </DashboardFiltersProvider>
  );
}
