import { SectionHeader } from "@/components/section-header";
import { TrendArea } from "@/components/charts/trend-area";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getAdsPerformance, getAdsTimeseries } from "@/lib/data-service";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function GoogleBingAdsPage() {
  const [performanceResult, timeseriesResult] = await Promise.all([getAdsPerformance(), getAdsTimeseries()]);

  const { data: performance, warning: performanceWarning, source: performanceSource, refreshedAt } = performanceResult;
  const { data: timeseries, warning: timeseriesWarning, source: timeseriesSource } = timeseriesResult;

  const totalSpend = performance.reduce((sum, item) => sum + item.spend, 0);
  const totalRevenue = performance.reduce((sum, item) => sum + item.revenue, 0);
  const totalClicks = performance.reduce((sum, item) => sum + item.clicks, 0);
  const totalConversions = performance.reduce((sum, item) => sum + item.conversions, 0);
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const blendedCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const channelBreakdown = performance.reduce(
    (acc, item) => {
      const channel = acc[item.channel] ?? {
        channel: item.channel,
        spend: 0,
        revenue: 0,
        conversions: 0,
        roas: 0,
      };
      channel.spend += item.spend;
      channel.revenue += item.revenue;
      channel.conversions += item.conversions;
      channel.roas = channel.spend > 0 ? channel.revenue / channel.spend : 0;
      acc[item.channel] = channel;
      return acc;
    },
    {} as Record<string, { channel: string; spend: number; revenue: number; conversions: number; roas: number }>,
  );

  const channelRows = Object.values(channelBreakdown).sort((a, b) => b.revenue - a.revenue);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (performanceSource === "sample" || timeseriesSource === "sample") {
    alerts.push({ key: "source", message: "Showing sample data until Supabase credentials are fully configured.", variant: "info" });
  }
  if (performanceWarning) {
    alerts.push({ key: "performance-warning", message: performanceWarning, variant: "warning" });
  }
  if (timeseriesWarning && timeseriesWarning !== performanceWarning) {
    alerts.push({ key: "timeseries-warning", message: timeseriesWarning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Google & Bing Ads"
        description="Track paid media efficiency across Google and Microsoft campaigns, monitor ROAS trends, and surface optimization opportunities."
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
        <MetricTile label="Total Spend" value={formatCurrency(totalSpend)} delta={{ value: "On plan", direction: "flat" }} accent="primary" />
        <MetricTile
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          delta={{ value: totalRevenue >= totalSpend ? "+ healthy ROAS" : "Monitor", direction: totalRevenue >= totalSpend ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Conversions"
          value={formatNumber(totalConversions)}
          delta={{ value: `${formatNumber(totalClicks)} clicks`, direction: "flat" }}
          accent="success"
        />
        <MetricTile
          label="Blended ROAS"
          value={`${blendedRoas.toFixed(1)}x`}
          delta={{ value: `CPA ${formatCurrency(blendedCpa)}`, direction: blendedCpa <= 35 ? "up" : "down" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader className="items-start">
          <div>
            <CardTitle>Revenue vs Ad Spend</CardTitle>
            <CardDescription>Monitor paid media efficiency over time to anticipate budget adjustments.</CardDescription>
          </div>
        </CardHeader>
        <TrendArea data={timeseries} primaryLabel="Revenue" secondaryLabel="Ad Spend" />
        <div className="mt-4 text-xs text-muted-foreground">Refreshed {new Date(refreshedAt).toLocaleString()}</div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Channel Breakdown</CardTitle>
              <CardDescription>Compare investment and returns across channels.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Channel</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">ROAS</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelRows.map((row) => (
                <TableRow key={row.channel}>
                  <TableCell className="capitalize">{row.channel}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                  <TableCell className="text-right">{`${row.roas.toFixed(1)}x`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Optimization Guidance</CardTitle>
              <CardDescription>Focus on campaigns with rising spend but lagging revenue to protect efficiency.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Campaign</TableHeadCell>
                <TableHeadCell>Channel</TableHeadCell>
                <TableHeadCell className="text-right">Spend</TableHeadCell>
                <TableHeadCell className="text-right">ROAS</TableHeadCell>
                <TableHeadCell className="text-right">CPA</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance
                .slice()
                .sort((a, b) => a.roas - b.roas)
                .map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="capitalize">{campaign.channel}</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell className="text-right">{`${campaign.roas.toFixed(1)}x`}</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.cpa)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
