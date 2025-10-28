import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLifecyclePerformance } from "@/lib/data-service";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const statusTone: Record<"active" | "paused" | "draft", string> = {
  active: "border-success/40 bg-success/10 text-success",
  paused: "border-warning/40 bg-warning/10 text-warning",
  draft: "border-border bg-muted/40 text-muted-foreground",
};

export default async function EmailMarketingPage() {
  const lifecycleResult = await getLifecyclePerformance("email");
  const { data: lifecycle, warning, source } = lifecycleResult;

  const totalSends = lifecycle.reduce((sum, item) => sum + item.sendCount, 0);
  const avgOpenRate = lifecycle.length
    ? lifecycle.reduce((sum, item) => sum + item.openRate, 0) / lifecycle.length
    : 0;
  const avgClickRate = lifecycle.length
    ? lifecycle.reduce((sum, item) => sum + item.clickRate, 0) / lifecycle.length
    : 0;
  const attributedRevenue = lifecycle.reduce((sum, item) => sum + item.revenue, 0);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "Showing sample Klaviyo data until API credentials are configured.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Email Marketing"
        description="Track Klaviyo campaigns and flows, monitor engagement rates, and surface optimization actions."
        badge="Lifecycle"
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
          label="Emails Sent"
          value={formatNumber(totalSends)}
          delta={{ value: "Last 30 days", direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Avg Open Rate"
          value={formatPercent(avgOpenRate)}
          delta={{ value: "Target ≥ 45%", direction: avgOpenRate >= 0.45 ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Avg Click Rate"
          value={formatPercent(avgClickRate)}
          delta={{ value: "Target ≥ 12%", direction: avgClickRate >= 0.12 ? "up" : "down" }}
          accent="success"
        />
        <MetricTile
          label="Attributed Revenue"
          value={formatCurrency(attributedRevenue)}
          delta={{ value: "Flows + campaigns", direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Flows & Campaigns</CardTitle>
            <CardDescription>Evaluate performance by lifecycle program to prioritize testing.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Sends</TableHeadCell>
              <TableHeadCell className="text-right">Open Rate</TableHeadCell>
              <TableHeadCell className="text-right">Click Rate</TableHeadCell>
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
              <TableHeadCell className="text-right">Conversion Rate</TableHeadCell>
              <TableHeadCell>Last Run</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lifecycle.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="capitalize">{item.type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize text-xs", statusTone[item.status])}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatNumber(item.sendCount)}</TableCell>
                <TableCell className="text-right">{formatPercent(item.openRate)}</TableCell>
                <TableCell className="text-right">{formatPercent(item.clickRate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                <TableCell className="text-right">{formatPercent(item.conversionRate)}</TableCell>
                <TableCell>{item.lastRunAt ? new Date(item.lastRunAt).toLocaleString() : "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Optimization Ideas</CardTitle>
            <CardDescription>Suggested experiments based on engagement and conversion signals.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-4 text-sm text-muted-foreground">
          <li>
            • Identify segments with open rate &lt; 40% and schedule subject line testing across the next two campaigns.
          </li>
          <li>
            • Add cross-sell blocks to the highest revenue flow to lift average order value.
          </li>
          <li>
            • Build reactivation journey for subscribers idle &gt; 90 days, leveraging high-performing SMS copy.
          </li>
        </ul>
      </Card>
    </div>
  );
}
