"use client";

import { useMemo } from "react";

import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import { getRangeBounds, parseDate, withinRange } from "@/lib/filter-utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { Quote } from "@/lib/types";

type Snapshot = Awaited<ReturnType<typeof import("@/lib/data-service").getSalesSnapshots>>["data"][number];
type AbandonedCart = Awaited<ReturnType<typeof import("@/lib/data-service").getAbandonedCarts>>["data"][number];
type HomeRun = Awaited<ReturnType<typeof import("@/lib/data-service").getHomeRuns>>["data"][number] & {
  closedAtIso?: string;
};

type RepsDashboardClientProps = {
  snapshots: Snapshot[];
  quotes: Quote[];
  carts: AbandonedCart[];
  homeRuns: HomeRun[];
};

export function RepsDashboardClient({ snapshots, quotes, carts, homeRuns }: RepsDashboardClientProps) {
  const { timeRange, vendor, rep } = useDashboardFilters();

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const candidateDates: Array<Date | null> = [
      ...quotes.map((quote) => parseDate(quote.date || quote.createdAt)),
      ...carts.map((cart) => parseDate(cart.date || cart.createdAt)),
      ...homeRuns.map((run) => parseDate(run.closedAtIso || run.closedAt)),
      ...snapshots.map((snapshot) => parseDate(snapshot.date)),
    ];
    return getRangeBounds(timeRange, candidateDates);
  }, [carts, homeRuns, quotes, snapshots, timeRange]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const date = parseDate(quote.date || quote.createdAt);
      if (!withinRange(date, rangeStart, rangeEnd)) return false;
      if (vendor && quote.vendor !== vendor) return false;
      if (rep && quote.rep !== rep) return false;
      return true;
    });
  }, [quotes, rangeEnd, rangeStart, rep, vendor]);

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

  const quoteValue = (quote: Quote) => quote.value ?? quote.amount ?? 0;

  const reps = useMemo(() => {
    const set = new Set<string>();
    filteredQuotes.forEach((quote) => set.add(quote.rep));
    filteredCarts.forEach((cart) => set.add(cart.rep));
    filteredHomeRuns.forEach((run) => set.add(run.rep));
    if (rep) {
      set.add(rep);
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [filteredCarts, filteredHomeRuns, filteredQuotes, rep]);

  const quoteMetricsByRep = useMemo(() => {
    const map = new Map<
      string,
      {
        openCount: number;
        openValue: number;
        closedCount: number;
        wonCount: number;
        wonValue: number;
      }
    >();

    filteredQuotes.forEach((quote) => {
      const entry = map.get(quote.rep) ?? {
        openCount: 0,
        openValue: 0,
        closedCount: 0,
        wonCount: 0,
        wonValue: 0,
      };

      if (quote.status === "open") {
        entry.openCount += 1;
        entry.openValue += quoteValue(quote);
      } else {
        entry.closedCount += 1;
        if (quote.status === "won") {
          entry.wonCount += 1;
          entry.wonValue += quoteValue(quote);
        }
      }

      map.set(quote.rep, entry);
    });

    return map;
  }, [filteredQuotes]);

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
    return reps.map((repName) => {
      const quoteMetrics = quoteMetricsByRep.get(repName) ?? {
        openCount: 0,
        openValue: 0,
        closedCount: 0,
        wonCount: 0,
        wonValue: 0,
      };
      const cartMetrics = cartsByRep.get(repName) ?? { actionableValue: 0 };
      const homeRunMetrics = homeRunMetricsByRep.get(repName) ?? { count: 0, value: 0 };

      const revenue = quoteMetrics.wonValue + homeRunMetrics.value;
      const pipeline = quoteMetrics.openValue;
      const winRate = quoteMetrics.closedCount > 0 ? quoteMetrics.wonCount / quoteMetrics.closedCount : 0;

      return {
        rep: repName,
        revenue,
        pipeline,
        winRate,
        openQuotes: quoteMetrics.openCount,
        actionableCarts: cartMetrics.actionableValue,
        homeRuns: homeRunMetrics.count,
      };
    });
  }, [cartsByRep, homeRunMetricsByRep, quoteMetricsByRep, reps]);

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
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
              <TableHeadCell className="text-right">Open Pipeline</TableHeadCell>
              <TableHeadCell className="text-right">Win Rate</TableHeadCell>
              <TableHeadCell className="text-right">Active Quotes</TableHeadCell>
              <TableHeadCell className="text-right">Actionable Cart Value</TableHeadCell>
              <TableHeadCell className="text-right">Home Runs</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary) => (
              <TableRow key={summary.rep}>
                <TableCell className="font-medium">{summary.rep}</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.revenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.pipeline)}</TableCell>
                <TableCell className="text-right">{formatPercent(summary.winRate)}</TableCell>
                <TableCell className="text-right">{formatNumber(summary.openQuotes)}</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.actionableCarts)}</TableCell>
                <TableCell className="text-right">{formatNumber(summary.homeRuns)}</TableCell>
              </TableRow>
            ))}
            {!summaries.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
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
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>• Review open quotes older than 14 days and align on next-step commitments.</li>
          <li>• Pair rep with highest cart value to automation owner for accelerated recovery campaign.</li>
          <li>• Celebrate latest home run wins and capture playbook notes in the Ops knowledge base.</li>
        </ul>
      </Card>
    </div>
  );
}
