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
import type { Quote } from "@/lib/types";
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

type SalesDashboardClientProps = {
  sales: SalesRecord[];
  quotes: Quote[];
  abandonedCarts: AbandonedCart[];
  homeRuns: HomeRunRecord[];
};

const TIME_RANGE_TO_DAYS: Record<string, number> = {
  "last-7": 7,
  "last-30": 30,
  quarter: 90,
  year: 365,
};

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

export default function SalesDashboardClient({ sales, quotes, abandonedCarts, homeRuns }: SalesDashboardClientProps) {
  const { timeRange, vendor, rep } = useDashboardFilters();

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      const aDate = normalizeDate(a.date)?.getTime() ?? 0;
      const bDate = normalizeDate(b.date)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [sales]);

  const latestSaleDate = useMemo(() => {
    const tail = sortedSales.at(-1);
    return tail ? normalizeDate(tail.date) ?? new Date() : new Date();
  }, [sortedSales]);

  const rangeStart = useMemo(() => {
    if (timeRange === "all") return null;
    const days = TIME_RANGE_TO_DAYS[timeRange];
    if (!days) return null;
    return subtractDays(latestSaleDate, days);
  }, [latestSaleDate, timeRange]);

  const rangeEnd = useMemo(() => {
    const end = new Date(latestSaleDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [latestSaleDate]);

  const filteredSales = useMemo(() => {
    return sortedSales.filter((record) => {
      const recordDate = normalizeDate(record.date);
      if (!recordDate) return false;
      if (rangeStart && recordDate < rangeStart) return false;
      if (recordDate > rangeEnd) return false;
      if (vendor && record.vendor !== vendor) return false;
      if (rep && record.rep !== rep) return false;
      return true;
    });
  }, [rangeEnd, rangeStart, rep, sortedSales, vendor]);

  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((record) => set.add(record.vendor));
    quotes.forEach((quote) => set.add(quote.vendor));
    homeRuns.forEach((run) => set.add(run.vendor));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [homeRuns, quotes, sales]);

  const repOptions = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((record) => set.add(record.rep));
    quotes.forEach((quote) => set.add(quote.rep));
    homeRuns.forEach((run) => set.add(run.rep));
    abandonedCarts.forEach((cart) => set.add(cart.rep));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [abandonedCarts, homeRuns, quotes, sales]);

  const latestPeriodKey = useMemo(() => {
    const latest = filteredSales.at(-1);
    if (!latest) return null;
    const date = normalizeDate(latest.date);
    return date ? monthKey(date) : null;
  }, [filteredSales]);

  const trailingRecords = useMemo(() => {
    if (!latestPeriodKey) return [] as SalesRecord[];
    return filteredSales.filter((record) => {
      const date = normalizeDate(record.date);
      return date ? monthKey(date) === latestPeriodKey : false;
    });
  }, [filteredSales, latestPeriodKey]);

  const trailingRevenue = useMemo(
    () => trailingRecords.reduce((sum, record) => sum + record.invoiceTotal, 0),
    [trailingRecords],
  );

  const trailingOrders = useMemo(
    () =>
      trailingRecords.reduce((sum, record) => {
        const value = record.orders > 0 ? record.orders : record.orderQuantity > 0 ? record.orderQuantity : 1;
        return sum + value;
      }, 0),
    [trailingRecords],
  );

  const trailingAvgOrder = trailingOrders > 0 ? trailingRevenue / trailingOrders : 0;

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
    const buckets = new Map<string, { label: string; revenue: number }>();
    filteredSales.forEach((record) => {
      const date = normalizeDate(record.date);
      if (!date) return;
      const key = monthKey(date);
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: 0,
        });
      }
      buckets.get(key)!.revenue += record.invoiceTotal;
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, bucket]) => ({
        date: bucket.label,
        value: bucket.revenue,
        secondary: 0, // TODO: Connect to real ad spend data
      }));
  }, [filteredSales]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const date = normalizeDate(quote.date || quote.createdAt);
      if (!date) return true;
      if (rangeStart && date < rangeStart) return false;
      if (date > rangeEnd) return false;
      if (vendor && quote.vendor !== vendor) return false;
      if (rep && quote.rep !== rep) return false;
      return true;
    });
  }, [quotes, rangeEnd, rangeStart, rep, vendor]);

  const quotePipelineValue = useMemo(
    () => filteredQuotes.reduce((sum, quote) => (quote.status === "open" ? sum + quote.value : sum), 0),
    [filteredQuotes],
  );

  const quoteWinRate = useMemo(() => {
    const closed = filteredQuotes.filter((quote) => quote.status === "won" || quote.status === "lost");
    if (!closed.length) return 0;
    const won = closed.filter((quote) => quote.status === "won").length;
    return won / closed.length;
  }, [filteredQuotes]);

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
        description="Monitor overall revenue trends, quotes pipeline health, and high-impact opportunities."
        badge="Pipeline"
      />

      <FilterControls vendors={vendorOptions} reps={repOptions} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Monthly Revenue"
          value={formatCurrency(trailingRevenue)}
          delta={{ value: "+6.2% vs prior", direction: "up" }}
          accent="primary"
        />
        <MetricTile
          label="Orders"
          value={formatNumber(trailingOrders)}
          delta={{ value: "+18 orders", direction: "up" }}
          accent="secondary"
        />
        <MetricTile
          label="Avg Order Value"
          value={formatCurrency(trailingAvgOrder)}
          delta={{ value: trailingAvgOrder ? "Stable" : "No data", direction: trailingAvgOrder ? "flat" : "flat" }}
          accent="success"
        />
        <MetricTile
          label="Quotes Pipeline"
          value={formatCurrency(quotePipelineValue)}
          delta={{
            value: `${formatPercent(quoteWinRate)} win rate`,
            direction: quoteWinRate >= 0.4 ? "up" : "down",
          }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader className="items-start">
          <div>
            <CardTitle>Revenue vs Spend</CardTitle>
            <CardDescription>Track revenue and marketing spend to understand contribution margin trends.</CardDescription>
          </div>
        </CardHeader>
        <TrendArea data={trendSeries} primaryLabel="Revenue" secondaryLabel="Ad Spend" />
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
