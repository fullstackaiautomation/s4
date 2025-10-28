"use client";

import { useMemo, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SAMPLE_ALERTS, SAMPLE_QUOTES, SAMPLE_SKUS } from "@/lib/sample-data";
import { OperationalAlert } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";

function ThemeToggleSuspense() {
  return (
    <Suspense fallback={<div className="h-9 w-9" />}>
      <ThemeToggle />
    </Suspense>
  );
}

const TIME_RANGE_OPTIONS = [
  { label: "Last 7", value: "last-7" },
  { label: "Last 30", value: "last-30" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

type TopBarProps = {
  alerts?: OperationalAlert[];
  vendors?: string[];
  reps?: string[];
};

export function TopBar({ alerts = SAMPLE_ALERTS, vendors, reps }: TopBarProps) {
  const { timeRange, vendor, rep, setTimeRange, setVendor, setRep } = useDashboardFilters();

  const vendorOptions = useMemo(() => {
    if (vendors && vendors.length) return vendors;
    const sampleVendors = new Set(SAMPLE_QUOTES.map((quote) => quote.vendor));
    SAMPLE_SKUS.forEach((sku) => sampleVendors.add(sku.vendor));
    return Array.from(sampleVendors.values());
  }, [vendors]);

  const repOptions = useMemo(() => {
    if (reps && reps.length) return reps;
    return Array.from(new Set(SAMPLE_QUOTES.map((quote) => quote.rep)));
  }, [reps]);

  const activeAlerts = alerts.slice(0, 3);

  return (
    <header className="sticky top-0 z-30 flex h-20 flex-col justify-center border-b border-border/80 bg-card/80 backdrop-blur-xl">
      <div className="flex flex-col gap-3 px-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TIME_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? "primary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(option.value as typeof timeRange)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={vendor ?? ""}
              onChange={(event) => setVendor(event.target.value || null)}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All Vendors</option>
              {vendorOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={rep ?? ""}
              onChange={(event) => setRep(event.target.value || null)}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">All Reps</option>
              {repOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ThemeToggleSuspense />
          </div>
        </div>

        {activeAlerts.length ? (
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Operational Alerts
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-xs shadow-subtle",
                    alert.level === "error"
                      ? "border-danger/40 bg-danger/5 text-danger"
                      : alert.level === "warning"
                        ? "border-warning/40 bg-warning/5 text-warning"
                        : "border-primary/30 bg-primary/5 text-primary",
                  )}
                >
                  <Badge variant="outline" className="uppercase">
                    {alert.level}
                  </Badge>
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
