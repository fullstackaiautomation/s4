import { SectionHeader } from "@/components/section-header";
import { TrendArea } from "@/components/charts/trend-area";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  getSkuAdSpendCategorySummary,
  getSkuAdSpendMonthlySummary,
  getSkuAdSpendTopSkus,
  getSkuAdSpendVendorSummary,
} from "@/lib/data-service";
import { TimeSeriesPoint } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

function buildAlerts(results: Array<{ source: "supabase" | "sample"; warning?: string | undefined }>) {
  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];

  if (results.some((result) => result.source === "sample")) {
    alerts.push({
      key: "sample-data",
      message: "Showing sample ad spend data until Supabase credentials are configured.",
      variant: "info",
    });
  }

  results.forEach((result, index) => {
    if (result.warning) {
      alerts.push({
        key: `warning-${index}`,
        message: result.warning,
        variant: "warning",
      });
    }
  });

  return alerts;
}

function mapByMonth(monthlySummary: Awaited<ReturnType<typeof getSkuAdSpendMonthlySummary>>["data"]) {
  const buckets = new Map<
    string,
    {
      month: string;
      spend: number;
      revenue: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }
  >();

  monthlySummary.forEach((row) => {
    const bucket = buckets.get(row.month) ?? {
      month: row.month,
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    bucket.spend += row.totalAdSpend;
    bucket.revenue += row.totalRevenue;
    bucket.impressions += row.totalImpressions;
    bucket.clicks += row.totalClicks;
    bucket.conversions += row.totalConversions;

    buckets.set(row.month, bucket);
  });

  return buckets;
}

function buildTimeseries(summary: ReturnType<typeof mapByMonth>): TimeSeriesPoint[] {
  return Array.from(summary.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((bucket) => ({
      date: bucket.month,
      value: bucket.revenue,
      secondary: bucket.spend,
    }));
}

export default async function ProductAdSpendDashboard() {
  const monthlySummaryResult = await getSkuAdSpendMonthlySummary();
  const monthlySummary = monthlySummaryResult.data;
  const monthlyBuckets = mapByMonth(monthlySummary);

  const latestMonth = monthlySummary[0]?.month;
  const latestMonthRows = latestMonth ? monthlySummary.filter((row) => row.month === latestMonth) : [];

  const [vendorSummaryResult, categorySummaryResult, topSkusResult] = await Promise.all([
    getSkuAdSpendVendorSummary(),
    getSkuAdSpendCategorySummary(),
    getSkuAdSpendTopSkus(20, latestMonth),
  ]);

  const vendorSummary = vendorSummaryResult.data;
  const categorySummary = categorySummaryResult.data;
  const topSkus = topSkusResult.data;

  const alerts = buildAlerts([monthlySummaryResult, vendorSummaryResult, categorySummaryResult, topSkusResult]);

  const latestTotals = latestMonthRows.reduce(
    (acc, row) => {
      acc.spend += row.totalAdSpend;
      acc.revenue += row.totalRevenue;
      acc.impressions += row.totalImpressions;
      acc.clicks += row.totalClicks;
      acc.conversions += row.totalConversions;
      return acc;
    },
    { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  const blendedRoas = latestTotals.spend > 0 ? latestTotals.revenue / latestTotals.spend : 0;
  const avgCpc = latestTotals.clicks > 0 ? latestTotals.spend / latestTotals.clicks : 0;
  const avgCtr = latestTotals.impressions > 0 ? latestTotals.clicks / latestTotals.impressions : 0;
  const activeVendors = vendorSummary.length;

  const timeseries = buildTimeseries(monthlyBuckets);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Product Ad Spend"
        description="Track platform mix, vendor performance, and ROI for every SKU-level advertising investment."
        badge="Marketing"
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
          label="Monthly Spend"
          value={formatCurrency(latestTotals.spend)}
          delta={{ value: latestMonth ? `Month ${latestMonth}` : "No data", direction: latestMonth ? "flat" : "down" }}
          accent="primary"
        />
        <MetricTile
          label="Monthly Revenue"
          value={formatCurrency(latestTotals.revenue)}
          delta={{
            value: latestTotals.spend ? `${(blendedRoas || 0).toFixed(1)}x ROAS` : "Awaiting spend",
            direction: blendedRoas >= 4 ? "up" : blendedRoas > 0 ? "flat" : "down",
          }}
          accent="secondary"
        />
        <MetricTile
          label="Avg CPC"
          value={formatCurrency(avgCpc)}
          delta={{
            value: `${formatNumber(latestTotals.clicks)} clicks`,
            direction: latestTotals.clicks > 0 ? "flat" : "down",
          }}
          accent="warning"
        />
        <MetricTile
          label="Active Vendors"
          value={formatNumber(activeVendors)}
          delta={{
            value: `${formatPercent(avgCtr || 0)} CTR`,
            direction: avgCtr >= 0.03 ? "up" : avgCtr > 0 ? "flat" : "down",
          }}
          accent="success"
        />
      </div>

      <Card>
        <CardHeader className="items-start">
          <div>
            <CardTitle>Revenue vs Ad Spend</CardTitle>
            <CardDescription>Monitor payback trends across platforms month over month.</CardDescription>
          </div>
        </CardHeader>
        <TrendArea data={timeseries} primaryLabel="Revenue" secondaryLabel="Ad Spend" />
        <div className="mt-4 text-xs text-muted-foreground">
          Refreshed {new Date(monthlySummaryResult.refreshedAt).toLocaleString()}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Identify partners driving the highest returns on ad spend.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Avg CPC</TableHeadCell>
                <TableHeadCell className="text-right">CTR</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorSummary.slice(0, 8).map((vendor) => (
                <TableRow key={vendor.vendor}>
                  <TableCell className="font-medium">{vendor.vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.totalAdSpend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.avgCpc ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatPercent((vendor.avgCtrPercent ?? 0) / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category Mix</CardTitle>
              <CardDescription>Compare spend and outcomes across product categories.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">Avg Spend</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorySummary.slice(0, 8).map((category) => (
                <TableRow key={category.productCategory}>
                  <TableCell className="font-medium">{category.productCategory}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.totalAdSpend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatNumber(category.totalConversions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(category.avgAdSpendPerRecord)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top SKUs {latestMonth ? `— ${latestMonth}` : ""}</CardTitle>
            <CardDescription>Drill into the highest spending products to guide optimization tests.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>SKU</TableHeadCell>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Platform</TableHeadCell>
              <TableHeadCell className="text-right">Spend</TableHeadCell>
              <TableHeadCell className="text-right">Revenue</TableHeadCell>
              <TableHeadCell className="text-right">ROAS</TableHeadCell>
              <TableHeadCell className="text-right">CTR</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topSkus.map((sku) => {
              const roas = sku.adSpend > 0 && sku.revenue ? sku.revenue / sku.adSpend : null;
              const ctr = sku.ctr ?? (sku.impressions && sku.clicks ? sku.clicks / sku.impressions : null);
              return (
                <TableRow key={`${sku.month}-${sku.sku}-${sku.platform}`}>
                  <TableCell className="font-medium">{sku.sku}</TableCell>
                  <TableCell>{sku.title}</TableCell>
                  <TableCell>{sku.platform}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sku.adSpend)}</TableCell>
                  <TableCell className="text-right">{sku.revenue != null ? formatCurrency(sku.revenue) : "—"}</TableCell>
                  <TableCell className="text-right">{roas != null ? `${roas.toFixed(1)}x` : "—"}</TableCell>
                  <TableCell className="text-right">{ctr != null ? formatPercent(ctr) : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
