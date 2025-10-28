"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type TimeRange = "last-7" | "last-30" | "quarter" | "year" | "all";

type DashboardFilters = {
  timeRange: TimeRange;
  vendor: string | null;
  rep: string | null;
  setTimeRange: (value: TimeRange) => void;
  setVendor: (value: string | null) => void;
  setRep: (value: string | null) => void;
};

const DashboardFiltersContext = createContext<DashboardFilters | undefined>(undefined);

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("last-30");
  const [vendor, setVendor] = useState<string | null>(null);
  const [rep, setRep] = useState<string | null>(null);

  const value = useMemo(
    () => ({ timeRange, vendor, rep, setTimeRange, setVendor, setRep }),
    [timeRange, vendor, rep],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) {
    throw new Error("useDashboardFilters must be used within DashboardFiltersProvider");
  }
  return ctx;
}
