import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { getBlogInsights, getOpportunityKeywords } from "@/lib/data-service";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function SeoPage() {
  const [keywordsResult, blogResult] = await Promise.all([getOpportunityKeywords(), getBlogInsights()]);

  const { data: keywords, warning: keywordsWarning, source: keywordsSource } = keywordsResult;
  const { data: blogInsights, warning: blogWarning, source: blogSource } = blogResult;

  const totalKeywords = keywords.length;
  const averageCurrentRank = totalKeywords
    ? keywords.reduce((sum, keyword) => sum + keyword.currentRank, 0) / totalKeywords
    : 0;
  const averageTargetRank = totalKeywords
    ? keywords.reduce((sum, keyword) => sum + keyword.targetRank, 0) / totalKeywords
    : 0;
  const averageRankDelta = averageCurrentRank - averageTargetRank;
  const highestVolumeKeyword = keywords.slice().sort((a, b) => b.searchVolume - a.searchVolume)[0];
  const totalSessions = blogInsights.reduce((sum, post) => sum + post.sessions, 0);

  const alerts: { key: string; message: string; variant: "info" | "warning" }[] = [];
  if (keywordsSource === "sample" || blogSource === "sample") {
    alerts.push({ key: "source", message: "Displaying sample SEO data until live integrations are connected.", variant: "info" });
  }
  if (keywordsWarning) {
    alerts.push({ key: "keywords", message: keywordsWarning, variant: "warning" });
  }
  if (blogWarning) {
    alerts.push({ key: "blog", message: blogWarning, variant: "warning" });
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="SEO Performance"
        description="Monitor organic search momentum, prioritize opportunity keywords, and align content backlog with growth goals."
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
          label="Opportunity Keywords"
          value={formatNumber(totalKeywords)}
          delta={{ value: "In focus backlog", direction: totalKeywords > 0 ? "up" : "flat" }}
          accent="primary"
        />
        <MetricTile
          label="Avg Rank → Target"
          value={`#${averageCurrentRank.toFixed(1)} → #${averageTargetRank.toFixed(1)}`}
          delta={{ value: `${averageRankDelta >= 0 ? "↓" : "↑"} ${(Math.abs(averageRankDelta)).toFixed(1)} positions remaining`, direction: averageRankDelta <= 0 ? "up" : "down" }}
          accent="secondary"
        />
        <MetricTile
          label="Top Volume Keyword"
          value={highestVolumeKeyword ? highestVolumeKeyword.keyword : "--"}
          delta={{ value: highestVolumeKeyword ? `${formatNumber(highestVolumeKeyword.searchVolume)} monthly searches` : "Add backlog", direction: highestVolumeKeyword ? "up" : "flat" }}
          accent="success"
        />
        <MetricTile
          label="Organic Sessions (Top Posts)"
          value={formatNumber(totalSessions)}
          delta={{ value: "Last 90 days", direction: "flat" }}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>SEO Opportunity Keywords</CardTitle>
            <CardDescription>Target keywords where ranking gains unlock the largest traffic lift.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Keyword</TableHeadCell>
              <TableHeadCell className="text-right">Search Volume</TableHeadCell>
              <TableHeadCell className="text-right">Current Rank</TableHeadCell>
              <TableHeadCell className="text-right">Target Rank</TableHeadCell>
              <TableHeadCell className="text-right">Difficulty</TableHeadCell>
              <TableHeadCell>Recommended Action</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((keyword) => (
              <TableRow key={keyword.keyword}>
                <TableCell className="font-medium capitalize">{keyword.keyword}</TableCell>
                <TableCell className="text-right">{formatNumber(keyword.searchVolume)}</TableCell>
                <TableCell className="text-right">#{keyword.currentRank}</TableCell>
                <TableCell className="text-right">#{keyword.targetRank}</TableCell>
                <TableCell className="text-right">{formatPercent(keyword.difficulty / 100)}</TableCell>
                <TableCell>{keyword.suggestedAction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Content Performance & Gaps</CardTitle>
            <CardDescription>Review high-performing posts and pair them with next best content ideas.</CardDescription>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Post</TableHeadCell>
              <TableHeadCell>Published</TableHeadCell>
              <TableHeadCell className="text-right">Sessions</TableHeadCell>
              <TableHeadCell className="text-right">Backlinks</TableHeadCell>
              <TableHeadCell>Top Keyword</TableHeadCell>
              <TableHeadCell>Suggested Topic</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogInsights.map((post) => (
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
    </div>
  );
}
