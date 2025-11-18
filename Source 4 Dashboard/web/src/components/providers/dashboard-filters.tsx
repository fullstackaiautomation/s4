"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type TimeRange = "last-month" | "last-7" | "last-30" | "quarter" | "year" | "all" | "custom";

type DashboardFilters = {
  timeRange: TimeRange;
  vendor: string | null;
  rep: string | null;
  customRange: {
    start: Date | null;
    end: Date | null;
  };
  setTimeRange: (value: TimeRange) => void;
  setVendor: (value: string | null) => void;
  setRep: (value: string | null) => void;
  setCustomRange: (range: { start: Date | null; end: Date | null }) => void;
};

const DashboardFiltersContext = createContext<DashboardFilters | undefined>(undefined);

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [vendor, setVendor] = useState<string | null>(null);
  const [rep, setRep] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const value = useMemo(
    () => ({ timeRange, vendor, rep, customRange, setTimeRange, setVendor, setRep, setCustomRange }),
    [customRange, rep, timeRange, vendor],
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
