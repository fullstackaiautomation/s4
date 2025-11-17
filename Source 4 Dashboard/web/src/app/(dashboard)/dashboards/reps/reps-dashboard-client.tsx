"use client";

import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import { getRangeBounds, parseDate, withinRange } from "@/lib/filter-utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

type SalesRecord = Awaited<ReturnType<typeof import("@/lib/data-service").getSalesRecords>>["data"][number];
type AbandonedCart = Awaited<ReturnType<typeof import("@/lib/data-service").getAbandonedCarts>>["data"][number];
type HomeRun = Awaited<ReturnType<typeof import("@/lib/data-service").getHomeRuns>>["data"][number] & {
  closedAtIso?: string;
};

const DUMMY_REPS = new Set(["Alice Johnson", "Bob Smith", "Carol Davis"]);

type RepsDashboardClientProps = {
  sales: SalesRecord[];
  carts: AbandonedCart[];
  homeRuns: HomeRun[];
};

export function RepsDashboardClient({ sales, carts, homeRuns }: RepsDashboardClientProps) {
  const { timeRange, vendor, rep } = useDashboardFilters();

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const candidateDates: Array<Date | null> = [
      ...sales.map((record) => parseDate(record.date)),
      ...carts.map((cart) => parseDate(cart.date || cart.createdAt)),
      ...homeRuns.map((run) => parseDate(run.closedAtIso || run.closedAt)),
    ];
    return getRangeBounds(timeRange, candidateDates);
  }, [carts, homeRuns, sales, timeRange]);

  const filteredSales = useMemo(() => {
    return sales.filter((record) => {
      const date = parseDate(record.date);
      if (!withinRange(date, rangeStart, rangeEnd)) return false;
      if (vendor && record.vendor !== vendor) return false;
      if (rep && record.rep !== rep) return false;
      return true;
    });
  }, [sales, rangeEnd, rangeStart, rep, vendor]);

  const filteredCarts = useMemo(() => {
    return carts.filter((cart) => {
      const date = parseDate(cart.date || cart.createdAt);
      if (!withinRange(date, rangeStart, rangeEnd)) return false;
      if (vendor && cart.vendor !== vendor) return false;
      if (rep && cart.rep !== rep) return false;
      return true;
    });
  }, [carts, rangeEnd, rangeStart, rep, vendor]);

  const filteredHomeRuns = useMemo(() => {
    return homeRuns.filter((run) => {
      const date = parseDate(run.closedAtIso || run.closedAt || run.date);
      if (!withinRange(date, rangeStart, rangeEnd)) return false;
      if (vendor && run.vendor !== vendor) return false;
      if (rep && run.rep !== rep) return false;
      return true;
    });
  }, [homeRuns, rangeEnd, rangeStart, rep, vendor]);

  const reps = useMemo(() => {
    const set = new Set<string>();
    filteredSales.forEach((record) => {
      if (record.rep && !DUMMY_REPS.has(record.rep)) {
        set.add(record.rep);
      }
    });
    filteredCarts.forEach((cart) => {
      if (cart.rep && !DUMMY_REPS.has(cart.rep)) {
        set.add(cart.rep);
      }
    });
    filteredHomeRuns.forEach((run) => {
      if (run.rep && !DUMMY_REPS.has(run.rep)) {
        set.add(run.rep);
      }
    });
    if (rep && !DUMMY_REPS.has(rep)) {
      set.add(rep);
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [filteredCarts, filteredHomeRuns, filteredSales, rep]);

  const salesMetricsByRep = useMemo(() => {
    const map = new Map<
      string,
      {
        revenue: number;
        orders: number;
      }
    >();

    filteredSales.forEach((record) => {
      const entry = map.get(record.rep) ?? {
        revenue: 0,
        orders: 0,
      };

      entry.revenue += record.invoiceTotal ?? 0;
      entry.orders += record.orders > 0 ? record.orders : record.orderQuantity > 0 ? record.orderQuantity : 1;

      map.set(record.rep, entry);
    });

    return map;
  }, [filteredSales]);

  const cartsByRep = useMemo(() => {
    const map = new Map<string, { actionableValue: number }>();
    filteredCarts.forEach((cart) => {
      if (cart.status === "open" || cart.status === "contacted") {
        const entry = map.get(cart.rep) ?? { actionableValue: 0 };
        entry.actionableValue += cart.value ?? 0;
        map.set(cart.rep, entry);
      }
    });
    return map;
  }, [filteredCarts]);

  const homeRunMetricsByRep = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    filteredHomeRuns.forEach((run) => {
      const entry = map.get(run.rep) ?? { count: 0, value: 0 };
      entry.count += 1;
      entry.value += run.value ?? 0;
      map.set(run.rep, entry);
    });
    return map;
  }, [filteredHomeRuns]);

  const summaries = useMemo(() => {
    return reps
      .map((repName) => {
        const salesMetrics = salesMetricsByRep.get(repName) ?? {
          revenue: 0,
          orders: 0,
        };
        const cartMetrics = cartsByRep.get(repName) ?? { actionableValue: 0 };
        const homeRunMetrics = homeRunMetricsByRep.get(repName) ?? { count: 0, value: 0 };

        // Get profit from sales records
        const repSales = filteredSales.filter((record) => record.rep === repName);
        const totalProfit = repSales.reduce((sum, record) => sum + (record.profitTotal ?? 0), 0);

        const totalRevenue = salesMetrics.revenue;
        const totalOrders = salesMetrics.orders;
        const totalHomeRuns = homeRunMetrics.count;
        const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

        // Calculate win rate as: home runs / (total orders + home runs)
        // This approximates closed deals (home runs) vs total opportunities
        const totalOpportunities = totalHomeRuns + totalOrders;
        const winRate = totalOpportunities > 0 ? totalHomeRuns / totalOpportunities : 0;

        return {
          rep: repName,
          orders: totalOrders,
          revenue: totalRevenue,
          profit: totalProfit,
          margin,
          winRate,
          actionableCarts: cartMetrics.actionableValue,
          homeRuns: totalHomeRuns,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [cartsByRep, filteredSales, homeRunMetricsByRep, salesMetricsByRep, reps]);

  const totalRevenue = summaries.reduce((sum, item) => sum + item.revenue, 0);
  const topRep = summaries.slice().sort((a, b) => b.revenue - a.revenue)[0];
  const averageWinRate = summaries.length
    ? summaries.reduce((sum, item) => sum + item.winRate, 0) / summaries.length
    : 0;
  const totalHomeRuns = summaries.reduce((sum, item) => sum + item.homeRuns, 0);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Reps Dashboard"
        description="Drill into individual performance to balance pipeline, revenue, and recovery activity."
        badge="Sales"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          delta={{ value: topRep ? `${topRep.rep} leading` : "", direction: "up" }}
          accent="primary"
        />
        <MetricTile
          label="Top Rep"
          value={topRep ? topRep.rep : "--"}
          delta={{ value: topRep ? formatCurrency(topRep.revenue) : "", direction: "flat" }}
          accent="secondary"
        />
        <MetricTile
          label="Average Win Rate"
          value={formatPercent(averageWinRate)}
          delta={{ value: "Target ≥ 40%", direction: averageWinRate >= 0.4 ? "up" : "down" }}
          accent="success"
        />
        <MetricTile
          label="Home Runs"
          value={formatNumber(totalHomeRuns)}
          delta={{ value: "Closed in range", direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Rep Performance Summary</CardTitle>
            <CardDescription>Evaluate revenue contribution, pipeline coverage, and follow-up priorities.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Rep</TableHeadCell>
              <TableHeadCell className="text-right">Orders</TableHeadCell>
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
              <TableHeadCell className="text-right">Profit</TableHeadCell>
              <TableHeadCell className="text-right">Margin</TableHeadCell>
              <TableHeadCell className="text-right">Home Runs</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary) => (
              <TableRow key={summary.rep}>
                <TableCell className="font-medium">{summary.rep}</TableCell>
                <TableCell className="text-right">{formatNumber(summary.orders)}</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.profit)}</TableCell>
                <TableCell className="text-right">{formatPercent(summary.margin)}</TableCell>
                <TableCell className="text-right">{formatNumber(summary.homeRuns)}</TableCell>
              </TableRow>
            ))}
            {!summaries.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No rep performance data matches the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Coaching Recommendations</CardTitle>
            <CardDescription>Use these focus areas during weekly rep syncs.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-3 px-6 py-4 text-sm text-muted-foreground">
          <li>• Review reps with low order volume and identify opportunities for pipeline growth.</li>
          <li>• Pair rep with highest cart value to automation owner for accelerated recovery campaign.</li>
          <li>• Celebrate latest home run wins and capture playbook notes in the Ops knowledge base.</li>
        </ul>
      </Card>
    </div>
  );
}
