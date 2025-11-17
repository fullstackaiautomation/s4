"use client";

import { useMemo } from "react";

import { TrendArea } from "@/components/charts/trend-area";
import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterControls } from "@/components/ui/filter-controls";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import type { SalesRecord } from "@/lib/data-service";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

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
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfMonth(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export default function SalesDashboardClient({ sales, abandonedCarts, homeRuns, snapshots }: SalesDashboardClientProps) {
  const { timeRange, vendor, rep } = useDashboardFilters();

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      const aDate = normalizeDate(a.date)?.getTime() ?? 0;
      const bDate = normalizeDate(b.date)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [sales]);

  const entityFilteredSales = useMemo(() => {
    return sortedSales.filter((record) => {
      if (vendor && record.vendor !== vendor) return false;
      if (rep && record.rep !== rep) return false;
      return true;
    });
  }, [rep, sortedSales, vendor]);

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
  }, [latestRelevantSaleDate, timeRange]);

  const filteredSales = useMemo(() => {
    return entityFilteredSales.filter((record) => {
      const recordDate = normalizeDate(record.date);
      if (!recordDate) return false;
      if (rangeStart && recordDate < rangeStart) return false;
      if (recordDate > rangeEnd) return false;
      return true;
    });
  }, [entityFilteredSales, rangeEnd, rangeStart]);

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
      const orders = record.orders > 0 ? record.orders : record.orderQuantity > 0 ? record.orderQuantity : 1;
      bucket.orders += orders;
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

  const latestBucket = monthlyBuckets.length ? monthlyBuckets[monthlyBuckets.length - 1] : undefined;

  const latestPeriodKey = latestBucket?.key ?? null;

  const trailingRecords = useMemo(() => {
    if (!latestPeriodKey) return filteredSales;
    return filteredSales.filter((record) => {
      const date = normalizeDate(record.date);
      return date ? monthKey(date) === latestPeriodKey : false;
    });
  }, [filteredSales, latestPeriodKey]);

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
    () =>
      filteredSales.reduce((sum, record) => {
        const value = record.orders > 0 ? record.orders : record.orderQuantity > 0 ? record.orderQuantity : 1;
        return sum + value;
      }, 0),
    [filteredSales],
  );

  const previousOrders = useMemo(
    () =>
      previousSalesRecords.reduce((sum, record) => {
        const value = record.orders > 0 ? record.orders : record.orderQuantity > 0 ? record.orderQuantity : 1;
        return sum + value;
      }, 0),
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

  const trailingTopVendors = useMemo(() => {
    const source = trailingRecords.length ? trailingRecords : filteredSales;
    const totals = new Map<string, number>();
    source.forEach((record) => {
      totals.set(record.vendor, (totals.get(record.vendor) ?? 0) + record.invoiceTotal);
    });
    return Array.from(totals.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales, trailingRecords]);

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
      .sort((a, b) => b.value - a.value);
  }, [homeRuns, rangeEnd, rangeStart, rep, vendor]);

  const homeRunTopFive = filteredHomeRuns.slice(0, 5);

  const filteredCarts = useMemo(() => {
    const carts = rep ? abandonedCarts.filter((cart) => cart.rep === rep) : abandonedCarts;
    return carts.slice(0, 6);
  }, [abandonedCarts, rep]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Sales Overview"
        badge="Pipeline"
        actions={<FilterControls vendors={vendorOptions} reps={repOptions} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label={timeRange === "all" ? "Total Revenue" : "Revenue"}
          value={formatCurrency(currentRevenue)}
          delta={revenueDelta}
          accent="primary"
        />
        <MetricTile
          label={timeRange === "all" ? "Total Profit" : "Profit"}
          value={formatCurrency(currentProfit)}
          delta={profitDelta}
          accent="warning"
        />
        <MetricTile
          label="Orders"
          value={formatNumber(currentOrders)}
          delta={ordersDelta}
          accent="secondary"
        />
        <MetricTile
          label="Margin"
          value={formatPercent(currentMargin)}
          delta={marginDelta}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader className="items-start">
          <div>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </div>
        </CardHeader>
        <TrendArea
          data={trendSeries}
          revenueLabel={timeRange === "all" ? "Total Revenue" : "Revenue"}
          profitLabel="Total Profit"
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Highest performing vendors in the latest period.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trailingTopVendors.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                </TableRow>
              ))}
              {!trailingTopVendors.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                    No data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Open Abandoned Carts</CardTitle>
              <CardDescription>Focus recovery efforts on high-value carts with recent activity.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Cart</TableHeadCell>
                <TableHeadCell>Rep</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell className="text-right">Value</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-medium">{cart.id}</TableCell>
                  <TableCell>{cart.rep}</TableCell>
                  <TableCell className="capitalize">{cart.status}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cart.value)}</TableCell>
                </TableRow>
              ))}
              {!filteredCarts.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No abandoned carts match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Home Runs</CardTitle>
            <CardDescription>Largest orders and their contributing reps.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Invoice</TableHeadCell>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell>Rep</TableHeadCell>
              <TableHeadCell className="text-right">Value</TableHeadCell>
              <TableHeadCell className="text-right">Closed</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {homeRunTopFive.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.invoice}</TableCell>
                <TableCell>{record.vendor}</TableCell>
                <TableCell>{record.rep}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.value)}</TableCell>
                <TableCell className="text-right">{record.closedAt}</TableCell>
              </TableRow>
            ))}
            {!homeRunTopFive.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No home run deals for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
