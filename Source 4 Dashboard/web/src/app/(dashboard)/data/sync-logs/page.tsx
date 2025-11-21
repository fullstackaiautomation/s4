import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getAllSyncLogs, getSyncLogSummaries } from "@/lib/data-service";
import { formatNumber } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, AlertCircle, Clock, Database } from "lucide-react";

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "partial":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "running":
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Database className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "success":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">Success</span>;
    case "failed":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">Failed</span>;
    case "partial":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">Partial</span>;
    case "running":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500">Running</span>;
    case "never":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">Never Synced</span>;
    default:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">Unknown</span>;
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default async function SyncLogsPage() {
  const [summariesResult, logsResult] = await Promise.all([
    getSyncLogSummaries(),
    getAllSyncLogs({ limit: 50 }),
  ]);

  const summaries = summariesResult.data || [];
  const logs = logsResult.data || [];

  // Calculate overall stats
  const totalSyncs = summaries.reduce((sum, s) => sum + s.totalSyncs, 0);
  const totalRecords = summaries.reduce((sum, s) => sum + s.totalRecordsSynced, 0);
  const avgSuccessRate = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + s.successRate, 0) / summaries.length
    : 0;
  const activeSyncs = summaries.filter(s => s.lastSyncStatus === "never").length;
  const healthyIntegrations = summaries.filter(s => s.lastSyncStatus === "success").length;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Data Sync Logs"
        description="Monitor all data integration syncs, track status, and troubleshoot any issues across Asana, Google Analytics, Search Console, and more."
        badge="Data"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Syncs"
          value={formatNumber(totalSyncs)}
          accent="primary"
        />
        <MetricTile
          label="Records Synced"
          value={formatNumber(totalRecords)}
          accent="secondary"
        />
        <MetricTile
          label="Success Rate"
          value={`${avgSuccessRate.toFixed(1)}%`}
          accent="success"
        />
        <MetricTile
          label="Healthy Integrations"
          value={`${healthyIntegrations}/${summaries.length}`}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Integration Health</CardTitle>
            <CardDescription>Overview of all data integrations and their sync status.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Integration</TableHeadCell>
              <TableHeadCell>Last Sync</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Total Syncs</TableHeadCell>
              <TableHeadCell className="text-right">Success Rate</TableHeadCell>
              <TableHeadCell className="text-right">Records Synced</TableHeadCell>
              <TableHeadCell className="text-right">Avg Duration</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.length > 0 ? (
              summaries.map((summary) => (
                <TableRow key={summary.integration}>
                  <TableCell className="font-medium">{summary.integration}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {summary.lastSyncAt
                      ? formatDistanceToNow(new Date(summary.lastSyncAt), { addSuffix: true })
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(summary.lastSyncStatus)}
                      {getStatusBadge(summary.lastSyncStatus)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(summary.totalSyncs)}</TableCell>
                  <TableCell className="text-right">
                    {summary.totalSyncs > 0 ? `${summary.successRate.toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(summary.totalRecordsSynced)}</TableCell>
                  <TableCell className="text-right">{formatDuration(summary.avgDuration)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No integration summaries available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>Detailed log of the latest 50 sync operations across all integrations.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Integration</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Started</TableHeadCell>
              <TableHeadCell>Duration</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Records</TableHeadCell>
              <TableHeadCell className="text-right">Created</TableHeadCell>
              <TableHeadCell className="text-right">Updated</TableHeadCell>
              <TableHeadCell>Date Range</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={`${log.integration}-${log.id}`}>
                  <TableCell className="font-medium">{log.integration}</TableCell>
                  <TableCell className="text-sm">
                    {log.syncType ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                        {log.syncType}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(log.duration)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(log.recordsSynced)}</TableCell>
                  <TableCell className="text-right">
                    {log.recordsCreated !== undefined ? formatNumber(log.recordsCreated) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.recordsUpdated !== undefined ? formatNumber(log.recordsUpdated) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.dateRangeStart && log.dateRangeEnd ? (
                      <span>
                        {new Date(log.dateRangeStart).toLocaleDateString()} - {new Date(log.dateRangeEnd).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No sync logs available yet. Syncs will appear here once integrations are active.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Error Log Section */}
      {logs.some(log => log.errors && log.errors.length > 0) && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-red-500">Sync Errors</CardTitle>
              <CardDescription>Recent sync operations that encountered errors.</CardDescription>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Integration</TableHeadCell>
                <TableHeadCell>Started</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Error Details</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs
                .filter(log => log.errors && log.errors.length > 0)
                .map((log) => (
                  <TableRow key={`error-${log.integration}-${log.id}`}>
                    <TableCell className="font-medium">{log.integration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-red-500 max-w-md">
                      {log.errors?.join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
