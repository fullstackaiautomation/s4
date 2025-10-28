import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAutomations, getOperationalAlerts } from "@/lib/data-service";
import { formatCurrency, formatNumber } from "@/lib/utils";

const statusTone: Record<"running" | "paused" | "error" | "draft", string> = {
  running: "success",
  paused: "warning",
  error: "danger",
  draft: "outline",
};

function statusBadge(status: "running" | "paused" | "error" | "draft") {
  const variant = statusTone[status];
  if (variant === "outline") {
    return <Badge variant="outline" className="capitalize">{status}</Badge>;
  }
  return <Badge variant={variant as "success" | "warning" | "danger"} className="capitalize">{status}</Badge>;
}

export default async function AutomationsDashboardPage() {
  const [automationsResult, alertsResult] = await Promise.all([getAutomations(), getOperationalAlerts()]);

  const { data: automations, warning: automationsWarning, source: automationsSource } = automationsResult;
  const { data: alerts, warning: alertsWarning, source: alertsSource } = alertsResult;

  const runningCount = automations.filter((automation) => automation.status === "running").length;
  const pausedCount = automations.filter((automation) => automation.status === "paused").length;
  const errorCount = automations.filter((automation) => automation.status === "error").length;
  const totalTimeSaved = automations.reduce((sum, automation) => sum + (automation.timeSavedHours ?? 0), 0);
  const totalDollars = automations.reduce(
    (sum, automation) => sum + (automation.dollarsAdded ?? 0) + (automation.dollarsSaved ?? 0),
    0,
  );

  const alertsList = alerts.slice(0, 5);

  const inlineAlerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (automationsSource === "sample" || alertsSource === "sample") {
    inlineAlerts.push({ key: "source", message: "Automation data currently uses sample records. Connect Supabase to pull live automation telemetry.", variant: "info" });
  }
  if (automationsWarning) {
    inlineAlerts.push({ key: "automations", message: automationsWarning, variant: "warning" });
  }
  if (alertsWarning) {
    inlineAlerts.push({ key: "alerts", message: alertsWarning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Automation Dashboard"
        description="Monitor automation health, impact, and alert streams."
        badge="Operations"
      />

      {inlineAlerts.length ? (
        <div className="space-y-3">
          {inlineAlerts.map((alert) => (
            <InlineAlert key={alert.key} message={alert.message} variant={alert.variant} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Running Automations"
          value={formatNumber(runningCount)}
          delta={{ value: `${pausedCount} paused`, direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Active Alerts"
          value={formatNumber(alertsList.length)}
          delta={{ value: `${errorCount} errors`, direction: errorCount > 0 ? "down" : "up" }}
          accent="danger"
        />
        <MetricTile
          label="Time Saved (hrs)"
          value={formatNumber(totalTimeSaved)}
          delta={{ value: "Reported YTD", direction: "flat" }}
          accent="secondary"
        />
        <MetricTile
          label="Financial Impact"
          value={formatCurrency(totalDollars)}
          delta={{ value: "Added + saved", direction: "up" }}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Operational Alerts</CardTitle>
            <CardDescription>Most recent automation notifications from n8n and other agents.</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-md border border-border/70 bg-card/80 p-3 text-sm shadow-subtle"
            >
              <Badge variant={alert.level === "error" ? "danger" : alert.level === "warning" ? "warning" : "outline"} className="uppercase">
                {alert.level}
              </Badge>
              <div>
                <div>{alert.message}</div>
                {alert.createdAt ? (
                  <div className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</div>
                ) : null}
              </div>
            </div>
          ))}
          {alertsList.length === 0 ? <div className="rounded-md border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">No alerts in the feed.</div> : null}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Automation Inventory</CardTitle>
            <CardDescription>Track owner, status, and quantitative impact.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Owner</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Hours Saved</TableHeadCell>
              <TableHeadCell className="text-right">$ Added</TableHeadCell>
              <TableHeadCell className="text-right">$ Saved</TableHeadCell>
              <TableHeadCell>Last Run</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map((automation) => (
              <TableRow key={automation.id}>
                <TableCell className="font-medium">{automation.name}</TableCell>
                <TableCell>{automation.owner}</TableCell>
                <TableCell>{statusBadge(automation.status)}</TableCell>
                <TableCell className="text-right">{formatNumber(automation.timeSavedHours ?? 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(automation.dollarsAdded ?? 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(automation.dollarsSaved ?? 0)}</TableCell>
                <TableCell>{automation.lastRunAt ? new Date(automation.lastRunAt).toLocaleString() : "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
