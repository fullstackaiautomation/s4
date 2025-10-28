import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Badge } from "@/components/ui/badge";
import { getAutomationProjects } from "@/lib/data-service";
import { formatNumber } from "@/lib/utils";

const stageOrder: Array<"Backlog" | "In Progress" | "QA" | "Launched"> = ["Backlog", "In Progress", "QA", "Launched"];

export default async function AutomationProjectsPage() {
  const projectsResult = await getAutomationProjects();
  const { data: projects, warning, source } = projectsResult;

  const columns = stageOrder.map((stage) => ({
    stage,
    items: projects.filter((project) => project.stage === stage),
  }));

  const totalHighPriority = projects.filter((project) => project.priority === "High").length;
  const upcomingReviews = projects.filter((project) => new Date(project.nextReview) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Automation Projects"
        description="Track automation initiatives from ideation through launch."
        badge="Ops"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Priority Snapshot</CardTitle>
              <CardDescription>Monitor workload and upcoming reviews.</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{formatNumber(totalHighPriority)}</span> high priority automations in flight.
            </div>
            <div>
              <span className="font-semibold text-foreground">{formatNumber(upcomingReviews)}</span> reviews scheduled within the next 7 days.
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Data Source</CardTitle>
              <CardDescription>Project board mirrored from Notion.</CardDescription>
            </div>
          </CardHeader>
          <div className="text-sm text-muted-foreground">
            Sync cadence configurable per workspace. Current sample data mirrors core board fields for demonstration.
          </div>
        </Card>
      </div>

      {source === "sample" || warning ? (
        <InlineAlert
          message={warning ?? "Displaying sample automation projects until Supabase sync is connected."}
          variant={warning ? "warning" : "info"}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.stage} className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 shadow-subtle">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{column.stage}</h3>
              <Badge variant="outline">{column.items.length}</Badge>
            </div>
            {column.items.length ? (
              <div className="space-y-3">
                {column.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 rounded-md border border-border/60 bg-card p-3 text-sm shadow-subtle">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{item.priority}</span>
                      <span>Owner: {item.owner}</span>
                      <span>Next review: {new Date(item.nextReview).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted/70 px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">Impact: {item.estimatedImpact}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
                No projects in this stage.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
