import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getAbandonedCarts, getHomeRuns, getQuotes, getSalesSnapshots } from "@/lib/data-service";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

type RepSummary = {
  rep: string;
  revenue: number;
  pipeline: number;
  winRate: number;
  openQuotes: number;
  actionableCarts: number;
  homeRuns: number;
};

export default async function RepsDashboardPage() {
  const [snapshotsResult, quotesResult, cartsResult, homeRunsResult] = await Promise.all([
    getSalesSnapshots(),
    getQuotes(),
    getAbandonedCarts(),
    getHomeRuns(),
  ]);

  const { data: snapshots, warning: snapshotsWarning, source: snapshotsSource } = snapshotsResult;
  const { data: quotes, warning: quotesWarning, source: quotesSource } = quotesResult;
  const { data: carts, warning: cartsWarning, source: cartsSource } = cartsResult;
  const { data: homeRuns, warning: homeRunsWarning, source: homeRunsSource } = homeRunsResult;

  const reps = new Set<string>();
  snapshots.forEach((snapshot) => snapshot.topReps.forEach((rep) => reps.add(rep.name)));
  quotes.forEach((quote) => reps.add(quote.rep));
  carts.forEach((cart) => reps.add(cart.rep));
  homeRuns.forEach((record) => reps.add(record.rep));

  const revenueByRep = new Map<string, number>();
  snapshots.forEach((snapshot) => {
    snapshot.topReps.forEach((rep) => {
      revenueByRep.set(rep.name, (revenueByRep.get(rep.name) ?? 0) + rep.revenue);
    });
  });

  const pipelineByRep = new Map<string, number>();
  const winRateByRep = new Map<string, number>();
  const openQuotesByRep = new Map<string, number>();
  reps.forEach((rep) => {
    const repQuotes = quotes.filter((quote) => quote.rep === rep);
    const openQuotes = repQuotes.filter((quote) => quote.status === "open");
    const closedQuotes = repQuotes.filter((quote) => quote.status !== "open");
    const wonQuotes = repQuotes.filter((quote) => quote.status === "won");
    pipelineByRep.set(rep, openQuotes.reduce((sum, quote) => sum + quote.value, 0));
    openQuotesByRep.set(rep, openQuotes.length);
    winRateByRep.set(rep, closedQuotes.length ? wonQuotes.length / closedQuotes.length : 0);
  });

  const actionableCartsByRep = new Map<string, number>();
  carts
    .filter((cart) => cart.status === "open" || cart.status === "contacted")
    .forEach((cart) => {
      actionableCartsByRep.set(cart.rep, (actionableCartsByRep.get(cart.rep) ?? 0) + cart.value);
    });

  const homeRunsByRep = new Map<string, number>();
  homeRuns.forEach((record) => {
    homeRunsByRep.set(record.rep, (homeRunsByRep.get(record.rep) ?? 0) + 1);
  });

  const summaries: RepSummary[] = Array.from(reps).map((rep) => ({
    rep,
    revenue: revenueByRep.get(rep) ?? 0,
    pipeline: pipelineByRep.get(rep) ?? 0,
    winRate: winRateByRep.get(rep) ?? 0,
    openQuotes: openQuotesByRep.get(rep) ?? 0,
    actionableCarts: actionableCartsByRep.get(rep) ?? 0,
    homeRuns: homeRunsByRep.get(rep) ?? 0,
  }));

  const totalRevenue = summaries.reduce((sum, rep) => sum + rep.revenue, 0);
  const topRep = summaries.slice().sort((a, b) => b.revenue - a.revenue)[0];
  const averageWinRate = summaries.length
    ? summaries.reduce((sum, rep) => sum + rep.winRate, 0) / summaries.length
    : 0;
  const totalHomeRuns = summaries.reduce((sum, rep) => sum + rep.homeRuns, 0);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if ([snapshotsSource, quotesSource, cartsSource, homeRunsSource].some((source) => source === "sample")) {
    alerts.push({ key: "source", message: "Using sample rep performance data. Connect Supabase imports for live results.", variant: "info" });
  }
  [snapshotsWarning, quotesWarning, cartsWarning, homeRunsWarning]
    .filter(Boolean)
    .forEach((message, index) => {
      alerts.push({ key: `warning-${index}`, message: message as string, variant: "warning" });
    });

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Reps Dashboard"
        description="Drill into individual performance to balance pipeline, revenue, and recovery activity."
        badge="Sales"
      />

      {alerts.length ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <InlineAlert key={alert.key} message={alert.message} variant={alert.variant} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Revenue (YTD)"
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
          delta={{ value: "Closed last quarter", direction: "flat" }}
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
              <TableHeadCell className="text-right">Revenue (YTD)</TableHeadCell>
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
