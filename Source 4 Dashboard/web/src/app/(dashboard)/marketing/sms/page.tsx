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

export default async function SmsMarketingPage() {
  const lifecycleResult = await getLifecyclePerformance("sms");
  const { data: lifecycle, warning, source } = lifecycleResult;

  const totalSends = lifecycle.reduce((sum, item) => sum + item.sendCount, 0);
  const avgClickRate = lifecycle.length
    ? lifecycle.reduce((sum, item) => sum + item.clickRate, 0) / lifecycle.length
    : 0;
  const avgConversionRate = lifecycle.length
    ? lifecycle.reduce((sum, item) => sum + item.conversionRate, 0) / lifecycle.length
    : 0;
  const attributedRevenue = lifecycle.reduce((sum, item) => sum + item.revenue, 0);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "SMS metrics currently use sample data; connect Attentive credentials to enable live sync.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="SMS Marketing"
        description="Review SMS journeys, monitor compliance health, and coordinate tests with email programs."
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
          label="Messages Sent"
          value={formatNumber(totalSends)}
          delta={{ value: "30-day volume", direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Avg Click Rate"
          value={formatPercent(avgClickRate)}
          delta={{ value: "Target ≥ 20%", direction: avgClickRate >= 0.2 ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Avg Conversion Rate"
          value={formatPercent(avgConversionRate)}
          delta={{ value: "Target ≥ 3%", direction: avgConversionRate >= 0.03 ? "up" : "down" }}
          accent="success"
        />
        <MetricTile
          label="Attributed Revenue"
          value={formatCurrency(attributedRevenue)}
          delta={{ value: "Journeys + blasts", direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Journeys & Campaigns</CardTitle>
            <CardDescription>Keep opt-in compliant while pushing for incremental conversions.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Sends</TableHeadCell>
              <TableHeadCell className="text-right">Click Rate</TableHeadCell>
              <TableHeadCell className="text-right">Conversion Rate</TableHeadCell>
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
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
                <TableCell className="text-right">{formatPercent(item.clickRate)}</TableCell>
                <TableCell className="text-right">{formatPercent(item.conversionRate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                <TableCell>{item.lastRunAt ? new Date(item.lastRunAt).toLocaleString() : "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Compliance & Experiment Checklist</CardTitle>
            <CardDescription>Ensure consent hygiene while rolling out performance experiments.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-4 text-sm text-muted-foreground">
          <li>• Audit opt-in source mix weekly; aim for ≥ 85% double opt-in coverage.</li>
          <li>• Deploy time-based branch for “Restock Nurture” once flow revenue exceeds $15K monthly.</li>
          <li>• Test MMS rich content on top-performing campaign to lift click-through rate.</li>
        </ul>
      </Card>
    </div>
  );
}
