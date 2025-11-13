"use client";

import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import { getRangeBounds, parseDate, withinRange } from "@/lib/filter-utils";
import { formatCurrency, formatNumber } from "@/lib/utils";

type HomeRunRecord = Awaited<ReturnType<typeof import("@/lib/data-service").getHomeRuns>>["data"][number] & {
  closedAtIso?: string;
};

type HomeRunsClientProps = {
  records: HomeRunRecord[];
  refreshedAt: string;
};

export function HomeRunsClient({ records, refreshedAt }: HomeRunsClientProps) {
  const { timeRange, vendor, rep } = useDashboardFilters();

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const dates = records.map((record) => parseDate(record.closedAtIso || record.closedAt || record.date));
    return getRangeBounds(timeRange, dates);
  }, [records, timeRange]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = parseDate(record.closedAtIso || record.closedAt || record.date);
      if (!withinRange(date, rangeStart, rangeEnd)) return false;
      if (vendor && record.vendor !== vendor) return false;
      if (rep && record.rep !== rep) return false;
      return true;
    });
  }, [rangeEnd, rangeStart, records, rep, vendor]);

  const totalValue = filteredRecords.reduce((sum, record) => sum + (record.value ?? 0), 0);
  const averageValue = filteredRecords.length ? totalValue / filteredRecords.length : 0;
  const topOrder = filteredRecords.slice().sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];

  const vendorBreakdown = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    filteredRecords.forEach((record) => {
      const key = record.vendor || "Unknown";
      const entry = map.get(key) ?? { value: 0, count: 0 };
      entry.value += record.value ?? 0;
      entry.count += 1;
      map.set(key, entry);
    });
    return map;
  }, [filteredRecords]);

  const sortedVendors = Array.from(vendorBreakdown.entries()).sort((a, b) => b[1].value - a[1].value);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Home Runs"
        description="Highlight the largest wins, celebrate rep performance, and replicate success playbooks."
        badge="Sales"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Home Run Value"
          value={formatCurrency(totalValue)}
          delta={{ value: `${formatNumber(filteredRecords.length)} orders`, direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Average Order"
          value={formatCurrency(averageValue)}
          delta={{ value: "Orders ≥ $50K", direction: averageValue >= 50000 ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Top Order"
          value={topOrder ? topOrder.invoice : "--"}
          delta={{ value: topOrder ? formatCurrency(topOrder.value ?? 0) : "", direction: "up" }}
          accent="success"
        />
        <MetricTile
          label="Leading Vendor"
          value={sortedVendors[0]?.[0] ?? "--"}
          delta={{ value: formatCurrency(sortedVendors[0]?.[1].value ?? 0), direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Large Order Detail</CardTitle>
            <CardDescription>Review vendor mix, reps involved, and timeline.</CardDescription>
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
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.invoice}</TableCell>
                <TableCell>{record.vendor}</TableCell>
                <TableCell>{record.rep}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.value ?? 0)}</TableCell>
                <TableCell className="text-right">{record.closedAt}</TableCell>
              </TableRow>
            ))}
            {!filteredRecords.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No large orders match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 text-xs text-muted-foreground">Refreshed {new Date(refreshedAt).toLocaleString()}</div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Vendor Contribution</CardTitle>
            <CardDescription>Understand where mega-orders originate.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell className="text-right">Total Value</TableHeadCell>
              <TableHeadCell className="text-right">Orders</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVendors.map(([vendorName, stats]) => (
              <TableRow key={vendorName}>
                <TableCell>{vendorName}</TableCell>
                <TableCell className="text-right">{formatCurrency(stats.value)}</TableCell>
                <TableCell className="text-right">{formatNumber(stats.count)}</TableCell>
              </TableRow>
            ))}
            {!sortedVendors.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  No vendor contributions for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
