import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getBlogInsights } from "@/lib/data-service";
import { formatNumber } from "@/lib/utils";

export default async function BlogPage() {
  const insightsResult = await getBlogInsights();
  const { data: insights, warning, source } = insightsResult;

  const topPost = insights[0];
  const totalPosts = insights.length;
  const totalSessions = insights.reduce((sum, post) => sum + post.sessions, 0);
  const averageSessions = totalPosts ? totalSessions / totalPosts : 0;
  const totalBacklinks = insights.reduce((sum, post) => sum + post.backlinks, 0);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (source === "sample") {
    alerts.push({ key: "source", message: "Blog analytics currently reference sample data. Connect Google Analytics/Search Console for live reporting.", variant: "info" });
  }
  if (warning) {
    alerts.push({ key: "warning", message: warning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Blog Performance"
        description="Spot high-performing posts, prioritize refreshes, and queue next editorial ideas."
        badge="Content"
      />

      {alerts.length ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <InlineAlert key={alert.key} message={alert.message} variant={alert.variant} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Published Posts" value={formatNumber(totalPosts)} delta={{ value: "Live content", direction: "flat" }} accent="primary" />
        <MetricTile label="Total Sessions" value={formatNumber(totalSessions)} delta={{ value: "Last 90 days", direction: "flat" }} accent="secondary" />
        <MetricTile label="Avg Sessions/Post" value={formatNumber(averageSessions)} delta={{ value: "Mean engagement", direction: "flat" }} accent="success" />
        <MetricTile
          label="Total Backlinks"
          value={formatNumber(totalBacklinks)}
          delta={{ value: topPost ? `Top post: ${topPost.title}` : "", direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Post Performance</CardTitle>
            <CardDescription>Sort by sessions to identify refresh and promotion candidates.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Published</TableHeadCell>
              <TableHeadCell className="text-right">Sessions</TableHeadCell>
              <TableHeadCell className="text-right">Backlinks</TableHeadCell>
              <TableHeadCell>Top Keyword</TableHeadCell>
              <TableHeadCell>Next Topic</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((post) => (
              <TableRow key={post.slug}>
                <TableCell className="font-medium">
                  <a href={post.url} target="_blank" rel="noreferrer" className="text-primary underline decoration-primary/40 hover:decoration-primary">
                    {post.title}
                  </a>
                </TableCell>
                <TableCell>{new Date(post.publishedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{formatNumber(post.sessions)}</TableCell>
                <TableCell className="text-right">{formatNumber(post.backlinks)}</TableCell>
                <TableCell className="capitalize">{post.topKeyword}</TableCell>
                <TableCell>{post.suggestedTopic ?? "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Editorial Pipeline</CardTitle>
            <CardDescription>Track high-value opportunities sourced from SEO and automation teams.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((post) => (
            <div key={post.slug} className="flex flex-col gap-2 rounded-md border border-border/60 bg-card/80 p-4 text-sm shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{post.suggestedTopic ?? "Expansion Idea"}</span>
                <Badge variant="outline">{post.topKeyword}</Badge>
              </div>
              <p className="text-muted-foreground">
                Build follow-up content to reinforce &ldquo;{post.title}&rdquo; momentum.
              </p>
              <div className="text-xs text-muted-foreground">Seed backlink target: {formatNumber(Math.max(post.backlinks + 10, 30))}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
