import { ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DashboardFiltersProvider } from "@/components/providers/dashboard-filters";
import { getOperationalAlerts, getQuotes, getSkuMaster } from "@/lib/data-service";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const [{ data: alerts }, { data: quotes }, { data: skus }] = await Promise.all([
    getOperationalAlerts(),
    getQuotes(),
    getSkuMaster(),
  ]);

  const vendorSet = new Set<string>();
  skus.forEach((sku) => vendorSet.add(sku.vendor));
  quotes.forEach((quote) => vendorSet.add(quote.vendor));

  const repSet = new Set<string>();
  quotes.forEach((quote) => repSet.add(quote.rep));

  return (
    <DashboardFiltersProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-transparent px-4 pt-4 sm:px-6 lg:hidden">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Source 4
              </span>
              <span className="text-lg font-semibold">Operations Console</span>
            </div>
            <MobileNav />
          </div>
          <TopBar alerts={alerts} vendors={Array.from(vendorSet)} reps={Array.from(repSet)} />
          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-16">{children}</div>
          </main>
        </div>
      </div>
    </DashboardFiltersProvider>
  );
}
