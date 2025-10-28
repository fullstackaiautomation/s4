import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getHomeRuns } from "@/lib/data-service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function HomeRunsPage() {
  const homeRunsResult = await getHomeRuns();
  const { data: homeRuns, warning, source, refreshedAt } = homeRunsResult;

  const totalValue = homeRuns.reduce((sum, record) => sum + record.value, 0);
  const averageValue = homeRuns.length ? totalValue / homeRuns.length : 0;
  const topOrder = homeRuns.slice().sort((a, b) => b.value - a.value)[0];

  const vendorBreakdown = homeRuns.reduce(
    (acc, record) => {
      acc[record.vendor] = (acc[record.vendor] ?? 0) + record.value;
      return acc;
    },
    {} as Record<string, number>,
  );

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "Home run data uses sample orders. Connect Supabase tables for live large-order tracking.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Home Runs"
        description="Highlight the largest wins, celebrate rep performance, and replicate success playbooks."
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
          label="Total Home Run Value"
          value={formatCurrency(totalValue)}
          delta={{ value: `${formatNumber(homeRuns.length)} orders`, direction: "flat" }}
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
          delta={{ value: topOrder ? formatCurrency(topOrder.value) : "", direction: "up" }}
          accent="success"
        />
        <MetricTile
          label="Leading Vendor"
          value={Object.entries(vendorBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "--"}
          delta={{ value: `Value ${formatCurrency(Object.values(vendorBreakdown).sort((a, b) => b - a)[0] ?? 0)}`, direction: "flat" }}
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
            {homeRuns.map((record) => (
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
            {Object.entries(vendorBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([vendor, value]) => (
                <TableRow key={vendor}>
                  <TableCell>{vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                  <TableCell className="text-right">{formatNumber(homeRuns.filter((record) => record.vendor === vendor).length)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
