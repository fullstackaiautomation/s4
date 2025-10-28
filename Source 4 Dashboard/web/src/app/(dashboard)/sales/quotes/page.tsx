import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getQuotes } from "@/lib/data-service";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const statusVariant: Record<"won" | "lost" | "open", "success" | "danger" | "warning"> = {
  won: "success",
  lost: "danger",
  open: "warning",
};

const statusOrder: Record<"open" | "won" | "lost", number> = {
  open: 0,
  won: 1,
  lost: 2,
};

export default async function QuotesPage() {
  const quotesResult = await getQuotes();
  const { data: quotes, warning, source, refreshedAt } = quotesResult;

  const pipelineValue = quotes.reduce((sum, quote) => (quote.status === "open" ? sum + quote.value : sum), 0);
  const wonValue = quotes.reduce((sum, quote) => (quote.status === "won" ? sum + quote.value : sum), 0);
  const lostValue = quotes.reduce((sum, quote) => (quote.status === "lost" ? sum + quote.value : sum), 0);
  const closedCount = quotes.filter((quote) => quote.status !== "open").length;
  const winRate = closedCount
    ? quotes.filter((quote) => quote.status === "won").length / closedCount
    : 0;

  const reps = Array.from(new Set(quotes.map((quote) => quote.rep)));
  const byRep = reps.map((rep) => {
    const repQuotes = quotes.filter((quote) => quote.rep === rep);
    const repOpen = repQuotes.filter((quote) => quote.status === "open");
    const repClosed = repQuotes.filter((quote) => quote.status !== "open");
    const repWin = repQuotes.filter((quote) => quote.status === "won");
    return {
      rep,
      openValue: repOpen.reduce((sum, quote) => sum + quote.value, 0),
      wonValue: repWin.reduce((sum, quote) => sum + quote.value, 0),
      winRate: repClosed.length ? repWin.length / repClosed.length : 0,
      activeCount: repOpen.length,
    };
  });

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "Quotes data currently uses sample records. Connect Supabase sheets for live pipeline visibility.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Quotes Pipeline"
        description="Monitor active quote value, conversion performance, and rep coverage."
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
          label="Open Pipeline"
          value={formatCurrency(pipelineValue)}
          delta={{ value: `Won ${formatCurrency(wonValue)} YTD`, direction: "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Win Rate"
          value={formatPercent(winRate)}
          delta={{ value: `${formatCurrency(wonValue)} closed`, direction: winRate >= 0.35 ? "up" : "down" }}
          accent="success"
        />
        <MetricTile
          label="Lost Value"
          value={formatCurrency(lostValue)}
          delta={{ value: "Last 90 days", direction: lostValue <= wonValue ? "up" : "down" }}
          accent="warning"
        />
        <MetricTile
          label="Active Quotes"
          value={formatNumber(quotes.filter((quote) => quote.status === "open").length)}
          delta={{ value: `${reps.length} reps`, direction: "flat" }}
          accent="secondary"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Quotes by Representative</CardTitle>
            <CardDescription>Balance follow-up volume and highlight coaching opportunities.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Sales Rep</TableHeadCell>
              <TableHeadCell className="text-right">Open Value</TableHeadCell>
              <TableHeadCell className="text-right">Won Value</TableHeadCell>
              <TableHeadCell className="text-right">Active Quotes</TableHeadCell>
              <TableHeadCell className="text-right">Win Rate</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byRep.map((row) => (
              <TableRow key={row.rep}>
                <TableCell className="font-medium">{row.rep}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.openValue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.wonValue)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.activeCount)}</TableCell>
                <TableCell className="text-right">{formatPercent(row.winRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-xs text-muted-foreground">Refreshed {new Date(refreshedAt).toLocaleString()}</div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pipeline Detail</CardTitle>
            <CardDescription>Track quote stage, vendor, and next actions.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Vendor</TableHeadCell>
              <TableHeadCell>Rep</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Value</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Close Date</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes
              .slice()
              .sort((a, b) => {
                const diff = statusOrder[a.status] - statusOrder[b.status];
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{quote.vendor}</TableCell>
                  <TableCell>{quote.rep}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[quote.status]} className="capitalize">
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(quote.value)}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{quote.closeDate ? new Date(quote.closeDate).toLocaleDateString() : "--"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
