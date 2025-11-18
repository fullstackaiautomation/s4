"use client";

import { useMemo } from "react";

import { SAMPLE_QUOTES, SAMPLE_SKUS } from "@/lib/sample-data";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";

const TIME_RANGE_OPTIONS = [
  { label: "Last Month", value: "last-month" },
  { label: "Last 7", value: "last-7" },
  { label: "Last 30", value: "last-30" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
  { label: "Custom", value: "custom" },
];

type FilterControlsProps = {
  vendors?: string[];
  reps?: string[];
};

export function FilterControls({ vendors, reps }: FilterControlsProps) {
  const { timeRange, vendor, rep, customRange, setTimeRange, setVendor, setRep, setCustomRange } = useDashboardFilters();
  const handleTimeRangeSelect = (value: typeof timeRange) => {
    setTimeRange(value);
    if (value === "custom") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const defaultEnd = customRange.end ?? now;
      const defaultStart = customRange.start
        ? customRange.start
        : new Date(defaultEnd.getFullYear(), defaultEnd.getMonth(), defaultEnd.getDate() - 29);
      setCustomRange({ start: defaultStart, end: defaultEnd });
    }
  };

  const formatInputDate = (value: Date | null) => {
    if (!value) return "";
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseInputDate = (value: string) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const handleCustomRangeChange = (range: { start?: string; end?: string }) => {
    const nextStart = range.start !== undefined ? parseInputDate(range.start) : customRange.start;
    const nextEnd = range.end !== undefined ? parseInputDate(range.end) : customRange.end;

    if (nextStart && nextEnd && nextStart > nextEnd) {
      // Swap to keep start <= end
      setCustomRange({ start: nextEnd, end: nextStart });
    } else {
      setCustomRange({ start: nextStart ?? null, end: nextEnd ?? null });
    }
  };

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={timeRange}
        onChange={(event) => handleTimeRangeSelect(event.target.value as typeof timeRange)}
        className="h-9 rounded-md border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {TIME_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {timeRange === "custom" ? (
        <div className="flex items-center gap-1 text-xs">
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">Start</span>
            <input
              type="date"
              value={formatInputDate(customRange.start)}
              onChange={(event) => handleCustomRangeChange({ start: event.target.value })}
              className="h-9 rounded-md border border-border bg-card px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <span className="text-muted-foreground">to</span>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">End</span>
            <input
              type="date"
              value={formatInputDate(customRange.end)}
              onChange={(event) => handleCustomRangeChange({ end: event.target.value })}
              className="h-9 rounded-md border border-border bg-card px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
        </div>
      ) : null}
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
    </div>
  );
}
