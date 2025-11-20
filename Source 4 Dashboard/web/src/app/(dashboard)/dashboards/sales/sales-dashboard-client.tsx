"use client";

import { useEffect, useMemo, useState } from "react";

import { TrendArea } from "@/components/charts/trend-area";
import { SectionHeader } from "@/components/section-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterControls } from "@/components/ui/filter-controls";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import type { SalesRecord } from "@/lib/data-service";
import { formatCurrency, formatNumber, formatPercent, formatRepName } from "@/lib/utils";

type AbandonedCart = {
  id: string;
  customer: string;
  value: number;
  date: string;
  createdAt: string;
  rep: string;
  vendor: string;
  status: "open" | "contacted" | "recovered";
  daysSinceAbandoned: number;
};

type HomeRunRecord = {
  id: string;
  product: string;
  sales: number;
  date: string;
  value: number;
  profit?: number;
  margin?: number;
  customer?: string;
  vendor: string;
  invoice: string;
  rep: string;
  closedAt: string;
  closedAtIso?: string;
};

type MonthlySnapshot = {
  date: string;
  value: number;
  secondary: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  topVendors: Array<{ name: string; revenue: number }>;
  topReps: Array<{ name: string; revenue: number }>;
};

type MonthlyBucket = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  profit: number;
};

type MetricDelta = {
  value: string;
  direction: "up" | "down" | "flat";
};

type DateRange = {
  start: Date;
  end: Date;
};

const DUMMY_VENDOR_PATTERN = /^Vendor [A-Z]$/;
const DUMMY_REPS = new Set(["Alice Johnson", "Bob Smith", "Carol Davis"]);
const MIN_VALID_SALES_DATE = new Date("2022-11-01T00:00:00Z");
const MIN_VALID_SALES_MONTH_KEY = "2022-11";
const YEAR_SCOPE = [2025, 2024, 2023] as const;

function buildPercentDelta(current: number, previous: number, canCompare: boolean, suffix = "vs prior"): MetricDelta | undefined {
  if (!canCompare) {
    if (current <= 0) return undefined;
    return { value: "All-time view", direction: "flat" };
  }

  if (previous <= 0) {
    if (current <= 0) return { value: "No prior data", direction: "flat" };
    return { value: "New vs prior", direction: "up" };
  }

  const change = current - previous;
  if (Math.abs(change) < Number.EPSILON) {
    return { value: "No change vs prior", direction: "flat" };
  }

  const percent = change / previous;
  const prefix = change > 0 ? "+" : "−";
  return {
    value: `${prefix}${formatPercent(Math.abs(percent))} ${suffix}`,
    direction: change > 0 ? "up" : "down",
  };
}

function buildAbsoluteDelta(current: number, previous: number, canCompare: boolean, label = "change vs prior"): MetricDelta | undefined {
  if (!canCompare) {
    if (current <= 0) return undefined;
    return { value: "All-time view", direction: "flat" };
  }

  if (previous <= 0) {
    if (current <= 0) return { value: "No prior data", direction: "flat" };
    return { value: "New vs prior", direction: "up" };
  }

  const change = current - previous;
  if (change === 0) {
    return { value: "No change vs prior", direction: "flat" };
  }

  const prefix = change > 0 ? "+" : "−";
  return {
    value: `${prefix}${formatNumber(Math.abs(change))} ${label}`,
    direction: change > 0 ? "up" : "down",
  };
}

type SalesDashboardClientProps = {
  sales: SalesRecord[];
  abandonedCarts: AbandonedCart[];
  homeRuns: HomeRunRecord[];
  snapshots: MonthlySnapshot[];
};

const TIME_RANGE_TO_DAYS: Record<string, number> = {
  "last-month": 30,
  "last-7": 7,
  "last-30": 30,
  quarter: 90,
  year: 365,
};

function formatMonthLabel(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - (days - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(date: Date) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return result;
}

function endOfMonth(date: Date) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export default function SalesDashboardClient({ sales, abandonedCarts, homeRuns, snapshots }: SalesDashboardClientProps) {
  const { timeRange, vendor, rep, customRange } = useDashboardFilters();
  const [showVendors, setShowVendors] = useState(true);

  const datasetStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, record) => sum + record.invoiceTotal, 0);
    const totalProfit = sales.reduce((sum, record) => sum + (record.profitTotal ?? 0), 0);
    const totalOrders = sales.reduce((sum, record) => sum + record.orders, 0);
    return { count: sales.length, totalRevenue, totalProfit, totalOrders };
  }, [sales]);

  const sortedSales = useMemo(() => {
    return [...sales]
      .filter((record) => {
        const parsedDate = normalizeDate(record.date);
        return parsedDate ? parsedDate >= MIN_VALID_SALES_DATE : false;
      })
      .sort((a, b) => {
      const aDate = normalizeDate(a.date)?.getTime() ?? 0;
      const bDate = normalizeDate(b.date)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [sales]);

  useEffect(() => {
    console.log("[SalesDashboard] dataset stats", datasetStats);
  }, [datasetStats]);

  const entityFilteredSales = useMemo(() => {
    return sortedSales.filter((record) => {
      if (vendor && record.vendor !== vendor) return false;
      if (rep && record.rep !== rep) return false;
      return true;
    });
  }, [rep, sortedSales, vendor]);

  const yearlyMonthlyAverages = useMemo(() => {
    type MonthlyTotals = { revenue: number; profit: number; orders: number };
    const aggregates = new Map<number, Map<string, MonthlyTotals>>();
    YEAR_SCOPE.forEach((year) => aggregates.set(year, new Map()));

    entityFilteredSales.forEach((record) => {
      const parsedDate = normalizeDate(record.date);
      if (!parsedDate) return;
      const year = parsedDate.getUTCFullYear();
      if (!YEAR_SCOPE.includes(year as (typeof YEAR_SCOPE)[number])) return;

      const month = monthKey(parsedDate);
      const yearBuckets = aggregates.get(year)!;
      const bucket = yearBuckets.get(month) ?? { revenue: 0, profit: 0, orders: 0 };
      bucket.revenue += record.invoiceTotal;
      bucket.profit += record.profitTotal ?? 0;
      bucket.orders += record.orders;
      yearBuckets.set(month, bucket);
    });

    const result: Record<number, { revenue: number | null; profit: number | null; orders: number | null; margin: number | null }> = {};

    YEAR_SCOPE.forEach((year) => {
      const entries = Array.from(aggregates.get(year)!.values());
      if (!entries.length) {
        result[year] = { revenue: null, profit: null, orders: null, margin: null };
        return;
      }

      const monthCount = entries.length;
      const totalRevenue = entries.reduce((sum, entry) => sum + entry.revenue, 0);
      const totalProfit = entries.reduce((sum, entry) => sum + entry.profit, 0);
      const totalOrders = entries.reduce((sum, entry) => sum + entry.orders, 0);
      const marginSamples = entries
        .filter((entry) => entry.revenue > 0)
        .map((entry) => entry.profit / entry.revenue);
      const marginAvg = marginSamples.length
        ? marginSamples.reduce((sum, value) => sum + value, 0) / marginSamples.length
        : null;

      result[year] = {
        revenue: totalRevenue / monthCount,
        profit: totalProfit / monthCount,
        orders: totalOrders / monthCount,
        margin: marginAvg,
      };
    });

    return result;
  }, [entityFilteredSales]);

  const revenueSideMetrics = useMemo(
    () =>
      YEAR_SCOPE.map((year) => {
        const value = yearlyMonthlyAverages[year]?.revenue ?? null;
        return {
          label: `${year} avg`,
          value: value != null ? formatCurrency(value) : "—",
        };
      }),
    [yearlyMonthlyAverages],
  );

  const profitSideMetrics = useMemo(
    () =>
      YEAR_SCOPE.map((year) => {
        const value = yearlyMonthlyAverages[year]?.profit ?? null;
        return {
          label: `${year} avg`,
          value: value != null ? formatCurrency(value) : "—",
        };
      }),
    [yearlyMonthlyAverages],
  );

  const ordersSideMetrics = useMemo(
    () =>
      YEAR_SCOPE.map((year) => {
        const value = yearlyMonthlyAverages[year]?.orders ?? null;
        return {
          label: `${year} avg`,
          value: value != null ? formatNumber(value) : "—",
        };
      }),
    [yearlyMonthlyAverages],
  );

  const marginSideMetrics = useMemo(
    () =>
      YEAR_SCOPE.map((year) => {
        const value = yearlyMonthlyAverages[year]?.margin ?? null;
        return {
          label: `${year} avg`,
          value: value != null ? formatPercent(value) : "—",
        };
      }),
    [yearlyMonthlyAverages],
  );

  const latestRelevantSaleDate = useMemo(() => {
    // Use the most recent sale date from actual data, not today's date
    const relevantSales = entityFilteredSales.length > 0 ? entityFilteredSales : sortedSales;
    if (relevantSales.length === 0) {
      // No sales data at all, fall back to current date
      return new Date();
    }

    // Find the maximum date in the data
    const maxDate = relevantSales.reduce((max, record) => {
      const recordDate = normalizeDate(record.date);
      if (!recordDate) return max;
      return recordDate > max ? recordDate : max;
    }, normalizeDate(relevantSales[0].date) ?? new Date());

    return maxDate;
  }, [entityFilteredSales, sortedSales]);

  const { rangeStart, rangeEnd, previousRange } = useMemo<{
    rangeStart: Date | null;
    rangeEnd: Date;
    previousRange: DateRange | null;
  }>(() => {
    const defaultRangeEnd = endOfDay(latestRelevantSaleDate);

    if (timeRange === "custom") {
      const customStart = customRange.start ? startOfDay(customRange.start) : null;
      const customEnd = customRange.end ? endOfDay(customRange.end) : defaultRangeEnd;

      return {
        rangeStart: customStart,
        rangeEnd: customEnd,
        previousRange: null,
      };
    }

    if (timeRange === "all") {
      return {
        rangeStart: null,
        rangeEnd: defaultRangeEnd,
        previousRange: null,
      };
    }

    if (timeRange === "last-month") {
      const currentMonthStart = startOfMonth(latestRelevantSaleDate);
      const currentMonthEnd = endOfMonth(latestRelevantSaleDate);
      const previousMonthReference = new Date(currentMonthStart);
      previousMonthReference.setMonth(previousMonthReference.getMonth() - 1);

      const previousMonthRange: DateRange = {
        start: startOfMonth(previousMonthReference),
        end: endOfMonth(previousMonthReference),
      };

      return {
        rangeStart: currentMonthStart,
        rangeEnd: currentMonthEnd,
        previousRange: previousMonthRange,
      };
    }

    const days = TIME_RANGE_TO_DAYS[timeRange];
    if (!days) {
      return {
        rangeStart: null,
        rangeEnd: defaultRangeEnd,
        previousRange: null,
      };
    }

    const currentRangeStart = subtractDays(latestRelevantSaleDate, days);
    const currentRangeEnd = defaultRangeEnd;

    const previousRangeEndCandidate = new Date(currentRangeStart);
    previousRangeEndCandidate.setMilliseconds(previousRangeEndCandidate.getMilliseconds() - 1);

    const previousRange: DateRange = {
      start: subtractDays(previousRangeEndCandidate, days),
      end: endOfDay(previousRangeEndCandidate),
    };

    return {
      rangeStart: currentRangeStart,
      rangeEnd: currentRangeEnd,
      previousRange,
    };
  }, [customRange.end, customRange.start, latestRelevantSaleDate, timeRange]);

  const filteredSales = useMemo(() => {
    return entityFilteredSales.filter((record) => {
      const recordDate = normalizeDate(record.date);
      if (!recordDate) return false;
      if (rangeStart && recordDate < rangeStart) return false;
      if (recordDate > rangeEnd) return false;
      return true;
    });
  }, [entityFilteredSales, rangeEnd, rangeStart]);

  useEffect(() => {
    const filteredRevenue = filteredSales.reduce((sum, record) => sum + record.invoiceTotal, 0);
    const filteredOrders = filteredSales.reduce((sum, record) => sum + record.orders, 0);
    const filteredProfit = filteredSales.reduce((sum, record) => sum + (record.profitTotal ?? 0), 0);
    console.log("[SalesDashboard] filtered stats", {
      timeRange,
      vendor,
      rep,
      count: filteredSales.length,
      filteredRevenue,
      filteredProfit,
      filteredOrders,
      rangeStart: rangeStart?.toISOString() ?? null,
      rangeEnd: rangeEnd.toISOString(),
    });
  }, [filteredSales, rangeEnd, rangeStart, rep, timeRange, vendor]);

  const previousSalesRecords = useMemo(() => {
    if (!previousRange) return [] as SalesRecord[];
    return entityFilteredSales.filter((record) => {
      const recordDate = normalizeDate(record.date);
      if (!recordDate) return false;
      if (recordDate < previousRange.start) return false;
      if (recordDate > previousRange.end) return false;
      return true;
    });
  }, [entityFilteredSales, previousRange]);

  const monthlyBuckets = useMemo<MonthlyBucket[]>(() => {
    if (!filteredSales.length) return [];

    const buckets = new Map<string, { revenue: number; profit: number; orders: number; label: string }>();
    filteredSales.forEach((record) => {
      const date = normalizeDate(record.date);
      if (!date) return;
      const key = monthKey(date);
      if (key < MIN_VALID_SALES_MONTH_KEY) return;
      if (!buckets.has(key)) {
        buckets.set(key, {
          revenue: 0,
          profit: 0,
          orders: 0,
          label: formatMonthLabel(date),
        });
      }

      const bucket = buckets.get(key)!;
      bucket.revenue += record.invoiceTotal;
      bucket.profit += record.profitTotal ?? 0;
      bucket.orders += record.orders;
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, bucket]) => ({
        key,
        label: bucket.label,
        revenue: bucket.revenue,
        profit: bucket.profit,
        orders: bucket.orders,
        avgOrderValue: bucket.orders > 0 ? bucket.revenue / bucket.orders : 0,
      }));
  }, [filteredSales]);

  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((record) => record.vendor && set.add(record.vendor));
    homeRuns.forEach((run) => run.vendor && set.add(run.vendor));
    abandonedCarts.forEach((cart) => cart.vendor && set.add(cart.vendor));
    return Array.from(set)
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && !DUMMY_VENDOR_PATTERN.test(name))
      .sort((a, b) => a.localeCompare(b));
  }, [abandonedCarts, homeRuns, sales]);

  const repOptions = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((record) => record.rep && set.add(record.rep));
    homeRuns.forEach((run) => run.rep && set.add(run.rep));
    abandonedCarts.forEach((cart) => cart.rep && set.add(cart.rep));
    return Array.from(set)
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && !DUMMY_REPS.has(name))
      .sort((a, b) => a.localeCompare(b));
  }, [abandonedCarts, homeRuns, sales]);

  const currentRevenue = useMemo(
    () => filteredSales.reduce((sum, record) => sum + record.invoiceTotal, 0),
    [filteredSales],
  );

  const previousRevenue = useMemo(
    () => previousSalesRecords.reduce((sum, record) => sum + record.invoiceTotal, 0),
    [previousSalesRecords],
  );

  const currentOrders = useMemo(
    () => filteredSales.reduce((sum, record) => sum + record.orders, 0),
    [filteredSales],
  );

  const previousOrders = useMemo(
    () => previousSalesRecords.reduce((sum, record) => sum + record.orders, 0),
    [previousSalesRecords],
  );

  const hasComparisonPeriod = Boolean(previousRange);

  const revenueDelta = useMemo(
    () => buildPercentDelta(currentRevenue, previousRevenue, hasComparisonPeriod),
    [currentRevenue, hasComparisonPeriod, previousRevenue],
  );

  const ordersDelta = useMemo(
    () => buildAbsoluteDelta(currentOrders, previousOrders, hasComparisonPeriod, "orders vs prior"),
    [currentOrders, hasComparisonPeriod, previousOrders],
  );

  const currentProfit = useMemo(
    () => filteredSales.reduce((sum, record) => sum + (record.profitTotal ?? 0), 0),
    [filteredSales],
  );

  const previousProfit = useMemo(
    () => previousSalesRecords.reduce((sum, record) => sum + (record.profitTotal ?? 0), 0),
    [previousSalesRecords],
  );

  const profitDelta = useMemo(
    () => buildPercentDelta(currentProfit, previousProfit, hasComparisonPeriod),
    [currentProfit, hasComparisonPeriod, previousProfit],
  );

  const currentMargin = currentRevenue > 0 ? currentProfit / currentRevenue : 0;
  const previousMargin = previousRevenue > 0 ? previousProfit / previousRevenue : 0;

  const marginDelta = useMemo(
    () => buildPercentDelta(currentMargin, previousMargin, hasComparisonPeriod),
    [currentMargin, hasComparisonPeriod, previousMargin],
  );

  const topVendors = useMemo(() => {
    const source = filteredSales;
    const totals = new Map<string, { revenue: number; profit: number; orders: number }>();
    source.forEach((record) => {
      const existing = totals.get(record.vendor) ?? { revenue: 0, profit: 0, orders: 0 };
      existing.revenue += record.invoiceTotal;
      existing.profit += record.profitTotal ?? 0;
      existing.orders += record.orders;
      totals.set(record.vendor, existing);
    });
    return Array.from(totals.entries())
      .map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        profit: stats.profit,
        orders: stats.orders,
        margin: stats.revenue > 0 ? stats.profit / stats.revenue : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  const topReps = useMemo(() => {
    const source = filteredSales;
    const totals = new Map<string, { revenue: number; profit: number; orders: number }>();
    source.forEach((record) => {
      const existing = totals.get(record.rep) ?? { revenue: 0, profit: 0, orders: 0 };
      existing.revenue += record.invoiceTotal;
      existing.profit += record.profitTotal ?? 0;
      existing.orders += record.orders;
      totals.set(record.rep, existing);
    });
    return Array.from(totals.entries())
      .map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        profit: stats.profit,
        orders: stats.orders,
        margin: stats.revenue > 0 ? stats.profit / stats.revenue : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  const trendSeries = useMemo(() => {
    if (monthlyBuckets.length) {
      return monthlyBuckets.map((bucket) => ({
        date: bucket.label,
        revenue: bucket.revenue,
        profit: bucket.profit,
      }));
    }

    if (!sales.length) {
      return snapshots.map((snapshot) => ({
        date: snapshot.date,
        revenue: snapshot.revenue,
        profit: snapshot.secondary ?? 0,
      }));
    }

    return [] as Array<{ date: string; revenue: number; profit: number }>;
  }, [monthlyBuckets, sales.length, snapshots]);

  const revenueTrendLabel = timeRange === "all" ? "Total Revenue" : "Revenue";
  const profitTrendLabel = "Total Profit";


  const filteredHomeRuns = useMemo(() => {
    return homeRuns
      .map((run) => ({
        ...run,
        parsedDate: normalizeDate(run.closedAtIso || run.date || run.closedAt),
      }))
      .filter((run) => {
        if (vendor && run.vendor !== vendor) return false;
        if (rep && run.rep !== rep) return false;
        if (rangeStart && run.parsedDate && run.parsedDate < rangeStart) return false;
        if (run.parsedDate && run.parsedDate > rangeEnd) return false;
        return true;
      })
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }, [homeRuns, rangeEnd, rangeStart, rep, vendor]);

  // Show all home runs, not just top 20
  const displayedHomeRuns = filteredHomeRuns;

  const formatYear = (dateString: string) => {
    const date = normalizeDate(dateString);
    if (!date) return dateString;
    return String(date.getFullYear());
  };

  // Home Runs stats - total and breakdowns
  const totalHomeRuns = useMemo(() => {
    return {
      count: filteredHomeRuns.length,
      revenue: filteredHomeRuns.reduce((sum, run) => sum + run.value, 0),
    };
  }, [filteredHomeRuns]);

  const homeRunsOver25K = useMemo(() => {
    const filtered = filteredHomeRuns.filter(run => run.value >= 25000);
    return {
      count: filtered.length,
      revenue: filtered.reduce((sum, run) => sum + run.value, 0),
    };
  }, [filteredHomeRuns]);

  const homeRuns10Kto25K = useMemo(() => {
    const filtered = filteredHomeRuns.filter(run => run.value >= 10000 && run.value < 25000);
    return {
      count: filtered.length,
      revenue: filtered.reduce((sum, run) => sum + run.value, 0),
    };
  }, [filteredHomeRuns]);

  // Top 3 reps by home run count
  const topRepsByHomeRuns = useMemo(() => {
    const repStats = new Map<string, { count: number; revenue: number }>();
    filteredHomeRuns.forEach(run => {
      const rep = run.rep;
      const existing = repStats.get(rep) || { count: 0, revenue: 0 };
      repStats.set(rep, {
        count: existing.count + 1,
        revenue: existing.revenue + run.value,
      });
    });

    return Array.from(repStats.entries())
      .map(([rep, stats]) => ({ rep, count: stats.count, revenue: stats.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredHomeRuns]);

  // Top 3 vendors by home run count
  const topVendorsByHomeRuns = useMemo(() => {
    const vendorStats = new Map<string, { count: number; revenue: number }>();
    filteredHomeRuns.forEach(run => {
      const vendor = run.vendor;
      const existing = vendorStats.get(vendor) || { count: 0, revenue: 0 };
      vendorStats.set(vendor, {
        count: existing.count + 1,
        revenue: existing.revenue + run.value,
      });
    });

    return Array.from(vendorStats.entries())
      .map(([vendor, stats]) => ({ vendor, count: stats.count, revenue: stats.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredHomeRuns]);

  return (
    <div className="space-y-6 px-6 py-4">
      <SectionHeader
        title="Sales Overview"
        actions={<FilterControls vendors={vendorOptions} reps={repOptions} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={timeRange === "all" ? "Total Revenue" : "Revenue"}
          value={formatCurrency(currentRevenue)}
          delta={revenueDelta}
          accent="primary"
          sideMetrics={revenueSideMetrics}
        />
        <MetricTile
          label={timeRange === "all" ? "Total Profit" : "Profit"}
          value={formatCurrency(currentProfit)}
          delta={profitDelta}
          accent="warning"
          sideMetrics={profitSideMetrics}
        />
        <MetricTile
          label="Orders"
          value={formatNumber(currentOrders)}
          delta={ordersDelta}
          accent="secondary"
          sideMetrics={ordersSideMetrics}
        />
        <MetricTile
          label="Margin"
          value={formatPercent(currentMargin)}
          delta={marginDelta}
          accent="success"
          sideMetrics={marginSideMetrics}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[6fr_4fr]">
        <Card className="h-[600px] overflow-hidden pt-4">
          <TrendArea
            data={trendSeries}
            revenueLabel={revenueTrendLabel}
            profitLabel={profitTrendLabel}
            legendPlacement="overlay"
            height={520}
          />
        </Card>

        <Card className="h-[600px] overflow-hidden pt-4">
          <div className="mb-4 flex items-center gap-2 px-4 text-sm font-medium">
            <button
              type="button"
              onClick={() => setShowVendors(true)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                showVendors
                  ? "bg-[rgb(32,71,255)] text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Vendors
            </button>
            <button
              type="button"
              onClick={() => setShowVendors(false)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                !showVendors
                  ? "bg-[rgb(32,71,255)] text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Reps
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell className="w-[180px]">{showVendors ? "Vendor" : "Rep"}</TableHeadCell>
                <TableHeadCell className="text-right">Orders</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Profit</TableHeadCell>
                <TableHeadCell className="text-right">Margin</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showVendors ? topVendors : topReps).map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{showVendors ? item.name : formatRepName(item.name)}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.orders)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.profit)}</TableCell>
                  <TableCell className="text-right">{formatPercent(item.margin)}</TableCell>
                </TableRow>
              ))}
              {!(showVendors ? topVendors : topReps).length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[6fr_4fr]">
        <Card className="h-[900px] overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-[1.7rem]">Home Run List</CardTitle>
          </CardHeader>
          <div className="pb-4 border-b border-slate-700/50">
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3" style={{ flex: '0 0 28%' }}>
                <div className="flex items-center gap-3" style={{ height: '28px' }}>
                  <span className="font-semibold text-yellow-400 min-w-[70px]">Total</span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatNumber(totalHomeRuns.count)} HRs
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {formatCurrency(totalHomeRuns.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3" style={{ height: '28px' }}>
                  <span className="font-semibold text-slate-300 min-w-[70px]">25K+</span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatNumber(homeRunsOver25K.count)} HRs
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {formatCurrency(homeRunsOver25K.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3" style={{ height: '28px' }}>
                  <span className="font-semibold text-orange-400 min-w-[70px]">10K-25K</span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatNumber(homeRuns10Kto25K.count)} HRs
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {formatCurrency(homeRuns10Kto25K.revenue)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3" style={{ flex: '0 0 32%' }}>
                {topRepsByHomeRuns.map((item, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const colors = ['text-yellow-400', 'text-slate-300', 'text-orange-400'];
                  return (
                    <div
                      key={item.rep}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xl">{medals[index]}</span>
                      <span className={`font-semibold ${colors[index]} min-w-[60px]`}>
                        {formatRepName(item.rep)}
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.count} {item.count === 1 ? 'HR' : 'HRs'}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3" style={{ flex: '1' }}>
                {topVendorsByHomeRuns.map((item, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const colors = ['text-yellow-400', 'text-slate-300', 'text-orange-400'];
                  return (
                    <div
                      key={item.vendor}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xl">{medals[index]}</span>
                      <span className={`font-semibold ${colors[index]} min-w-[110px]`}>
                        {item.vendor}
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.count} {item.count === 1 ? 'HR' : 'HRs'}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Invoice</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Rep</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell className="text-center">Revenue</TableHeadCell>
                <TableHeadCell className="text-center">Profit</TableHeadCell>
                <TableHeadCell className="text-center">Margin</TableHeadCell>
                <TableHeadCell className="text-center">Year</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedHomeRuns.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.invoice}</TableCell>
                  <TableCell>{record.customer ?? "Unknown"}</TableCell>
                  <TableCell>{formatRepName(record.rep)}</TableCell>
                  <TableCell>{record.vendor}</TableCell>
                  <TableCell className="text-center">{formatCurrency(record.value)}</TableCell>
                  <TableCell className="text-center">
                    {typeof record.profit === "number" ? formatCurrency(record.profit) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {typeof record.margin === "number" ? formatPercent(record.margin) : "—"}
                  </TableCell>
                  <TableCell className="text-center">{formatYear(record.closedAtIso || record.date || record.closedAt)}</TableCell>
                </TableRow>
              ))}
              {!displayedHomeRuns.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No home run deals for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>

        <Card className="h-[900px] overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-[1.7rem]">Monthly Performance</CardTitle>
          </CardHeader>
          <div className="pb-4 border-b border-slate-700/50">
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3" style={{ flex: '0 0 28%' }}>
                {[2025, 2024, 2023].map((year) => {
                  const yearBuckets = monthlyBuckets.filter(bucket => bucket.key.startsWith(String(year)));
                  const yearRevenue = yearBuckets.reduce((sum, bucket) => sum + bucket.revenue, 0);
                  const yearProfit = yearBuckets.reduce((sum, bucket) => sum + bucket.profit, 0);
                  return (
                    <div
                      key={year}
                      className="flex items-center gap-3"
                      style={{ height: '28px' }}
                    >
                      <span className="font-semibold text-yellow-400 min-w-[50px]">{year}</span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(yearRevenue)}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(yearProfit)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3" style={{ flex: '1' }}>
                {monthlyBuckets.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 3).map((bucket, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const colors = ['text-yellow-400', 'text-slate-300', 'text-orange-400'];
                  return (
                    <div
                      key={bucket.key}
                      className="flex items-center gap-3"
                      style={{ height: '28px' }}
                    >
                      <span className="text-xl">{medals[index]}</span>
                      <span className={`font-semibold ${colors[index]} min-w-[80px]`}>
                        {bucket.label}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(bucket.revenue)}
                      </span>
                      <span className="text-sm font-medium text-slate-200">
                        {formatCurrency(bucket.profit)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell className="text-center">Month</TableHeadCell>
                <TableHeadCell className="text-center">Revenue</TableHeadCell>
                <TableHeadCell className="text-center">Profit</TableHeadCell>
                <TableHeadCell className="text-center">Margin</TableHeadCell>
                <TableHeadCell className="text-center">Orders</TableHeadCell>
                <TableHeadCell className="text-center">Rank</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyBuckets.slice().reverse().map((bucket) => {
                const sortedByRevenue = monthlyBuckets.slice().sort((a, b) => b.revenue - a.revenue);
                const rank = sortedByRevenue.findIndex(b => b.key === bucket.key) + 1;
                return (
                  <TableRow key={bucket.key}>
                    <TableCell className="font-medium text-center">{bucket.label}</TableCell>
                    <TableCell className="text-center">{formatCurrency(bucket.revenue)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(bucket.profit)}</TableCell>
                    <TableCell className="text-center">
                      {bucket.revenue > 0 ? formatPercent(bucket.profit / bucket.revenue) : "—"}
                    </TableCell>
                    <TableCell className="text-center">{formatNumber(bucket.orders)}</TableCell>
                    <TableCell className="text-center">{rank}</TableCell>
                  </TableRow>
                );
              })}
              {!monthlyBuckets.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No monthly data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
