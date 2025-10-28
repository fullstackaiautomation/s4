import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAbandonedCarts } from "@/lib/data-service";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const statusTone: Record<"open" | "contacted" | "recovered" | "closed", string> = {
  open: "border-warning/40 bg-warning/10 text-warning",
  contacted: "border-primary/40 bg-primary/10 text-primary",
  recovered: "border-success/40 bg-success/10 text-success",
  closed: "border-border bg-muted/50 text-muted-foreground",
};

export default async function AbandonedCartsPage() {
  const cartsResult = await getAbandonedCarts();
  const { data: carts, warning, source, refreshedAt } = cartsResult;

  const actionableCarts = carts.filter((cart) => cart.status === "open" || cart.status === "contacted");
  const actionableValue = actionableCarts.reduce((sum, cart) => sum + cart.value, 0);
  const recoveredValue = carts.filter((cart) => cart.status === "recovered").reduce((sum, cart) => sum + cart.value, 0);
  const averageDays = carts.length ? carts.reduce((sum, cart) => sum + cart.daysSinceAbandoned, 0) / carts.length : 0;
  const recoveryRate = carts.length
    ? carts.filter((cart) => cart.status === "recovered").length / carts.length
    : 0;

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "Abandoned cart data currently uses sample inputs. Connect Supabase upload to track live recovery progress.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Abandoned Carts"
        description="Recover high-value opportunities by prioritizing outreach based on recency and value."
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
          label="Actionable Value"
          value={formatCurrency(actionableValue)}
          delta={{ value: `${formatNumber(actionableCarts.length)} carts`, direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Recovered Value"
          value={formatCurrency(recoveredValue)}
          delta={{ value: "Last 90 days", direction: "flat" }}
          accent="success"
        />
        <MetricTile
          label="Recovery Rate"
          value={`${(recoveryRate * 100).toFixed(1)}%`}
          delta={{ value: "Target ≥ 35%", direction: recoveryRate >= 0.35 ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Avg Days Since Abandon"
          value={averageDays.toFixed(1)}
          delta={{ value: "Keep &lt; 10 days", direction: averageDays <= 10 ? "up" : "down" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recovery Priorities</CardTitle>
            <CardDescription>Focus on recent, high-value carts across reps.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Cart ID</TableHeadCell>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell>Rep</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Value</TableHeadCell>
              <TableHeadCell className="text-right">Days Since Abandon</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts
              .slice()
              .sort((a, b) => a.daysSinceAbandoned - b.daysSinceAbandoned)
              .map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-medium">{cart.id}</TableCell>
                  <TableCell>{cart.vendor}</TableCell>
                  <TableCell>{cart.rep}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusTone[cart.status])}>
                      {cart.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(cart.value)}</TableCell>
                  <TableCell className="text-right">{cart.daysSinceAbandoned}</TableCell>
                  <TableCell>{new Date(cart.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-xs text-muted-foreground">Refreshed {new Date(refreshedAt).toLocaleString()}</div>
      </Card>
    </div>
  );
}
