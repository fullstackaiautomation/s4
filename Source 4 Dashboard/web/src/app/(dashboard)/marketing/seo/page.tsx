import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getGSCOverview, getGSCTopQueries, getGSCTopPages, getGSCDeviceBreakdown } from "@/lib/data-service";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function SeoPage() {
  // Fetch GSC data for last 30 days
  const [overviewResult, queriesResult, pagesResult, devicesResult] = await Promise.all([
    getGSCOverview(),
    getGSCTopQueries({ limit: 20 }),
    getGSCTopPages({ limit: 15 }),
    getGSCDeviceBreakdown()
  ]);

  const { data: overview, warning: overviewWarning, source: overviewSource } = overviewResult;
  const { data: topQueries, warning: queriesWarning, source: queriesSource } = queriesResult;
  const { data: topPages, warning: pagesWarning, source: pagesSource } = pagesResult;
  const { data: devices, warning: devicesWarning, source: devicesSource } = devicesResult;

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];

  if (overviewSource === "sample" || queriesSource === "sample" || pagesSource === "sample") {
    alerts.push({
      key: "source",
      message: "Google Search Console data is loading. Displaying limited data until sync completes.",
      variant: "info"
    });
  }

  if (overviewWarning) {
    alerts.push({ key: "overview", message: overviewWarning, variant: "warning" });
  }
  if (queriesWarning) {
    alerts.push({ key: "queries", message: queriesWarning, variant: "warning" });
  }
  if (pagesWarning) {
    alerts.push({ key: "pages", message: pagesWarning, variant: "warning" });
  }

  const topQuery = topQueries[0];
  const topPage = topPages[0];
  const mobileDevice = devices.find(d => d.device === 'MOBILE');
  const mobileClickShare = mobileDevice && overview.totalClicks > 0
    ? (mobileDevice.clicks / overview.totalClicks) * 100
    : 0;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="SEO Performance"
        description="Real-time organic search performance from Google Search Console. Monitor clicks, impressions, rankings, and device trends."
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
          label="Total Clicks (30d)"
          value={formatNumber(overview.totalClicks)}
          delta={{
            value: `${overview.clicksChange >= 0 ? '+' : ''}${overview.clicksChange.toFixed(1)}% vs prior period`,
            direction: overview.clicksChange >= 0 ? "up" : "down"
          }}
          accent="primary"
        />
        <MetricTile
          label="Total Impressions (30d)"
          value={formatNumber(overview.totalImpressions)}
          delta={{
            value: `${overview.impressionsChange >= 0 ? '+' : ''}${overview.impressionsChange.toFixed(1)}% vs prior period`,
            direction: overview.impressionsChange >= 0 ? "up" : "down"
          }}
          accent="secondary"
        />
        <MetricTile
          label="Avg Click-Through Rate"
          value={formatPercent(overview.avgCtr)}
          delta={{
            value: `${overview.ctrChange >= 0 ? '+' : ''}${overview.ctrChange.toFixed(1)}% vs prior period`,
            direction: overview.ctrChange >= 0 ? "up" : "down"
          }}
          accent="success"
        />
        <MetricTile
          label="Avg Position"
          value={`#${overview.avgPosition.toFixed(1)}`}
          delta={{
            value: `${overview.positionChange <= 0 ? 'Better' : 'Worse'} vs prior period`,
            direction: overview.positionChange <= 0 ? "up" : "down"
          }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top Search Queries</CardTitle>
            <CardDescription>Keywords driving the most organic clicks to your site (last 30 days).</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Query</TableHeadCell>
              <TableHeadCell className="text-right">Clicks</TableHeadCell>
              <TableHeadCell className="text-right">Impressions</TableHeadCell>
              <TableHeadCell className="text-right">CTR</TableHeadCell>
              <TableHeadCell className="text-right">Avg Position</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topQueries.length > 0 ? (
              topQueries.map((query, idx) => (
                <TableRow key={`${query.query}-${idx}`}>
                  <TableCell className="font-medium">{query.query}</TableCell>
                  <TableCell className="text-right">{formatNumber(query.clicks)}</TableCell>
                  <TableCell className="text-right">{formatNumber(query.impressions)}</TableCell>
                  <TableCell className="text-right">{formatPercent(query.ctr)}</TableCell>
                  <TableCell className="text-right">#{query.position.toFixed(1)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No search query data available. Waiting for GSC sync to complete.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>URLs with the most organic traffic (last 30 days).</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Page</TableHeadCell>
                <TableHeadCell className="text-right">Clicks</TableHeadCell>
                <TableHeadCell className="text-right">CTR</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPages.length > 0 ? (
                topPages.map((page, idx) => {
                  const url = new URL(page.page);
                  const displayPath = url.pathname === '/' ? 'Homepage' : url.pathname;

                  return (
                    <TableRow key={`${page.page}-${idx}`}>
                      <TableCell className="font-medium max-w-xs truncate" title={page.page}>
                        <a
                          href={page.page}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline decoration-primary/40 hover:decoration-primary"
                        >
                          {displayPath}
                        </a>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(page.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(page.ctr)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No page data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Traffic distribution by device type (last 30 days).</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Device</TableHeadCell>
                <TableHeadCell className="text-right">Clicks</TableHeadCell>
                <TableHeadCell className="text-right">Share</TableHeadCell>
                <TableHeadCell className="text-right">CTR</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length > 0 ? (
                devices.map((device, idx) => {
                  const share = overview.totalClicks > 0
                    ? (device.clicks / overview.totalClicks) * 100
                    : 0;

                  return (
                    <TableRow key={`${device.device}-${idx}`}>
                      <TableCell className="font-medium capitalize">{device.device.toLowerCase()}</TableCell>
                      <TableCell className="text-right">{formatNumber(device.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(share / 100)}</TableCell>
                      <TableCell className="text-right">{formatPercent(device.ctr)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No device data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
