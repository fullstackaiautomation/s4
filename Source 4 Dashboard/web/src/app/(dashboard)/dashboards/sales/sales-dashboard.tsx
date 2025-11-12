import { SectionHeader } from "@/components/section-header";
import { TrendArea } from "@/components/charts/trend-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getAbandonedCarts, getHomeRuns, getQuotes, getSalesSnapshots } from "@/lib/data-service";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default async function SalesDashboard() {
  const [{ data: snapshots }, { data: quotes }, { data: abandonedCarts }, { data: homeRuns }] = await Promise.all([
    getSalesSnapshots(),
    getQuotes(),
    getAbandonedCarts(),
    getHomeRuns(),
  ]);

  const trendSeries = snapshots.map((snapshot) => ({
    date: snapshot.date,
    value: snapshot.revenue ?? snapshot.value ?? 0,
    secondary: snapshot.secondary ?? (snapshot.revenue ?? snapshot.value ?? 0) * 0.65,
  }));

  const trailingSnapshot = snapshots.at(-1);
  const trailingRevenue = trailingSnapshot?.revenue ?? 0;
  const trailingOrders = trailingSnapshot?.orders ?? 0;
  const trailingAvgOrder = trailingSnapshot?.avgOrderValue ?? 0;
  const trailingTopVendors = trailingSnapshot?.topVendors ?? [];

  const quotePipelineValue = quotes.reduce((sum, quote) => (quote.status === "open" ? sum + quote.value : sum), 0);
  const quoteWinRate = (() => {
    const closed = quotes.filter((quote) => quote.status === "won" || quote.status === "lost");
    if (!closed.length) return 0;
    const won = closed.filter((quote) => quote.status === "won").length;
    return won / closed.length;
  })();

  const homeRunTopFive = homeRuns.slice(0, 5);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Source 4 Industries Performance Dashboard"
        description="Monitor overall revenue trends, quotes pipeline health, and high-impact opportunities."
        badge="Pipeline"
      />

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
          delta={{ value: "Stable", direction: "flat" }}
          accent="success"
        />
        <MetricTile
          label="Quotes Pipeline"
          value={formatCurrency(quotePipelineValue)}
          delta={{ value: `${formatPercent(quoteWinRate)} win rate`, direction: quoteWinRate >= 0.4 ? "up" : "down" }}
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
              {trailingTopVendors.map((vendor) => (
                <TableRow key={vendor.name}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.revenue)}</TableCell>
                </TableRow>
              ))}
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
              {abandonedCarts.slice(0, 6).map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-medium">{cart.id}</TableCell>
                  <TableCell>{cart.rep}</TableCell>
                  <TableCell className="capitalize">{cart.status}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cart.value)}</TableCell>
                </TableRow>
              ))}
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
