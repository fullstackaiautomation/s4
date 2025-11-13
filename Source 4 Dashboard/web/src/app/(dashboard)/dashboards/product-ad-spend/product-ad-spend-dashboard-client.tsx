"use client";

import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { TrendArea } from "@/components/charts/trend-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import { getRangeBounds, withinRange } from "@/lib/filter-utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type {
  getSkuAdSpendCategorySummary,
  getSkuAdSpendMonthlySummary,
  getSkuAdSpendTopSkus,
  getSkuAdSpendVendorSummary,
} from "@/lib/data-service";

type MonthlySummaryResult = Awaited<ReturnType<typeof getSkuAdSpendMonthlySummary>>;
type VendorSummaryResult = Awaited<ReturnType<typeof getSkuAdSpendVendorSummary>>;
type CategorySummaryResult = Awaited<ReturnType<typeof getSkuAdSpendCategorySummary>>;
type TopSkusResult = Awaited<ReturnType<typeof getSkuAdSpendTopSkus>>;

type ProductAdSpendDashboardClientProps = {
  monthlySummary: MonthlySummaryResult;
  vendorSummary: VendorSummaryResult;
  categorySummary: CategorySummaryResult;
  topSkus: TopSkusResult;
};

function monthToDate(month: string) {
  if (!month) return null;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;
  const date = new Date(year, monthIndex, 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ProductAdSpendDashboardClient({ monthlySummary, vendorSummary, categorySummary, topSkus }: ProductAdSpendDashboardClientProps) {
  const { timeRange, vendor } = useDashboardFilters();

  const candidateDates = useMemo(() => {
    const months = monthlySummary.data.map((row) => monthToDate(row.month));
    const skuMonths = topSkus.data.map((row) => monthToDate(row.month));
    return [...months, ...skuMonths];
  }, [monthlySummary.data, topSkus.data]);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRangeBounds(timeRange, candidateDates),
    [candidateDates, timeRange],
  );

  const filteredTopSkus = useMemo(() => {
    return topSkus.data.filter((row) => {
      if (vendor && row.platform !== vendor) return false;
      return withinRange(monthToDate(row.month), rangeStart, rangeEnd);
    });
  }, [rangeEnd, rangeStart, topSkus.data, vendor]);

  const filteredMonthly = useMemo(() => {
    const inRange = monthlySummary.data.filter((row) => withinRange(monthToDate(row.month), rangeStart, rangeEnd));
    if (!vendor || filteredTopSkus.length === 0) {
      return inRange;
    }

    const aggregated = new Map<string, {
      month: string;
      totalAdSpend: number;
      totalRevenue: number;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
    }>();

    filteredTopSkus.forEach((row) => {
      const bucket = aggregated.get(row.month) ?? {
        month: row.month,
        totalAdSpend: 0,
        totalRevenue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
      };

      bucket.totalAdSpend += row.adSpend ?? 0;
      bucket.totalRevenue += row.revenue ?? 0;
      bucket.totalImpressions += row.impressions ?? 0;
      bucket.totalClicks += row.clicks ?? 0;
      aggregated.set(row.month, bucket);
    });

    if (aggregated.size === 0) {
      return [];
    }

    return Array.from(aggregated.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredTopSkus, monthlySummary.data, rangeEnd, rangeStart, vendor]);

  const filteredVendorSummary = useMemo(() => {
    if (vendor) {
      return vendorSummary.data.filter((row) => row.vendor === vendor);
    }
    return vendorSummary.data.slice().sort((a, b) => b.totalAdSpend - a.totalAdSpend);
  }, [vendor, vendorSummary.data]);

  const filteredCategorySummary = useMemo(() => {
    if (!vendor) return categorySummary.data;
    return categorySummary.data;
  }, [categorySummary.data, vendor]);

  const sortedMonthly = useMemo(() => filteredMonthly.slice().sort((a, b) => b.month.localeCompare(a.month)), [filteredMonthly]);
  const latestMonth = sortedMonthly[0]?.month ?? null;
  const latestTotals = sortedMonthly
    .filter((row) => row.month === latestMonth)
    .reduce(
      (acc, row) => {
        acc.spend += row.totalAdSpend;
        acc.revenue += row.totalRevenue;
        acc.impressions += row.totalImpressions ?? 0;
        acc.clicks += row.totalClicks ?? 0;
        acc.conversions += row.totalConversions ?? 0;
        return acc;
      },
      { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 },
    );

  const blendedRoas = latestTotals.spend > 0 ? latestTotals.revenue / latestTotals.spend : 0;
  const avgCpc = latestTotals.clicks > 0 ? latestTotals.spend / latestTotals.clicks : 0;
  const avgCtr = latestTotals.impressions > 0 ? latestTotals.clicks / latestTotals.impressions : 0;

  const activeVendors = useMemo(() => {
    if (vendor) {
      return filteredTopSkus.length ? 1 : 0;
    }
    const set = new Set<string>();
    filteredTopSkus.forEach((row) => set.add(row.platform));
    if (set.size === 0) {
      return filteredVendorSummary.length;
    }
    return set.size;
  }, [filteredTopSkus, filteredVendorSummary, vendor]);

  const timeseries = useMemo(() => {
    return sortedMonthly
      .slice()
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((bucket) => ({
        date: bucket.month,
        value: bucket.totalRevenue,
        secondary: bucket.totalAdSpend,
      }));
  }, [sortedMonthly]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Product Ad Spend"
        description="Track platform mix, vendor performance, and ROI for every SKU-level advertising investment."
        badge="Marketing"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Monthly Spend"
          value={formatCurrency(latestTotals.spend)}
          delta={{ value: latestMonth ? `Month ${latestMonth}` : "No data", direction: latestMonth ? "flat" : "down" }}
          accent="primary"
        />
        <MetricTile
          label="Monthly Revenue"
          value={formatCurrency(latestTotals.revenue)}
          delta={{
            value: latestTotals.spend ? `${blendedRoas.toFixed(1)}x ROAS` : "Awaiting spend",
            direction: blendedRoas >= 4 ? "up" : blendedRoas > 0 ? "flat" : "down",
          }}
          accent="secondary"
        />
        <MetricTile
          label="Avg CPC"
          value={formatCurrency(avgCpc)}
          delta={{ value: `${formatNumber(latestTotals.clicks)} clicks`, direction: latestTotals.clicks > 0 ? "flat" : "down" }}
          accent="warning"
        />
        <MetricTile
          label="Active Vendors"
          value={formatNumber(activeVendors)}
          delta={{ value: `${formatPercent(avgCtr || 0)} CTR`, direction: avgCtr >= 0.03 ? "up" : avgCtr > 0 ? "flat" : "down" }}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader className="items-start">
          <div>
            <CardTitle>Revenue vs Ad Spend</CardTitle>
            <CardDescription>Monitor payback trends across platforms month over month.</CardDescription>
          </div>
        </CardHeader>
        <TrendArea data={timeseries} primaryLabel="Revenue" secondaryLabel="Ad Spend" />
        {monthlySummary.refreshedAt ? (
          <div className="mt-4 text-xs text-muted-foreground">Refreshed {new Date(monthlySummary.refreshedAt).toLocaleString()}</div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Identify partners driving the highest returns on ad spend.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Avg CPC</TableHeadCell>
                <TableHeadCell className="text-right">CTR</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendorSummary.slice(0, 8).map((entry) => (
                <TableRow key={entry.vendor}>
                  <TableCell className="font-medium">{entry.vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.totalAdSpend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.avgCpc ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatPercent((entry.avgCtrPercent ?? 0) / 100)}</TableCell>
                </TableRow>
              ))}
              {!filteredVendorSummary.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No vendor data matches the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category Mix</CardTitle>
              <CardDescription>Compare spend and outcomes across product categories.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">Avg Spend</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategorySummary.slice(0, 8).map((entry) => (
                <TableRow key={entry.productCategory}>
                  <TableCell className="font-medium">{entry.productCategory}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.totalAdSpend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatNumber(entry.totalConversions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(entry.avgAdSpendPerRecord)}</TableCell>
                </TableRow>
              ))}
              {!filteredCategorySummary.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No category results for the selected filters.
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
            <CardTitle>Top SKUs {latestMonth ? `— ${latestMonth}` : ""}</CardTitle>
            <CardDescription>Drill into the highest spending products to guide optimization tests.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>SKU</TableHeadCell>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Platform</TableHeadCell>
              <TableHeadCell className="text-right">Spend</TableHeadCell>
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
              <TableHeadCell className="text-right">ROAS</TableHeadCell>
              <TableHeadCell className="text-right">CTR</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTopSkus.map((sku) => {
              const roas = sku.adSpend > 0 && sku.revenue ? sku.revenue / sku.adSpend : null;
              const ctr = sku.ctr ?? (sku.impressions && sku.clicks ? sku.clicks / sku.impressions : null);
              return (
                <TableRow key={`${sku.month}-${sku.sku}-${sku.platform}`}>
                  <TableCell className="font-medium">{sku.sku}</TableCell>
                  <TableCell>{sku.title}</TableCell>
                  <TableCell>{sku.platform}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sku.adSpend)}</TableCell>
                  <TableCell className="text-right">{sku.revenue != null ? formatCurrency(sku.revenue) : "—"}</TableCell>
                  <TableCell className="text-right">{roas != null ? `${roas.toFixed(1)}x` : "—"}</TableCell>
                  <TableCell className="text-right">{ctr != null ? formatPercent(ctr) : "—"}</TableCell>
                </TableRow>
              );
            })}
            {!filteredTopSkus.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No SKU ad spend records match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
