import { cn } from "@/lib/utils";

type MetricProps = {
  label: string;
  value: string;
  delta?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
  icon?: React.ReactNode;
  accent?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  sideMetrics?: Array<{ label: string; value: string }>;
};

const accentClass: Record<NonNullable<MetricProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function MetricTile({
  label,
  value,
  delta,
  icon,
  accent = "primary",
  className,
  sideMetrics,
}: MetricProps) {
  const deltaIcon = delta
    ? delta.direction === "up"
      ? "▲"
      : delta.direction === "down"
        ? "▼"
        : "■"
    : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-subtle",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            {icon ? (
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", accentClass[accent])}>{icon}</div>
            ) : null}
          </div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          {delta ? (
            <div className={cn("flex items-center gap-1 text-xs font-medium", accentClass[accent])}>
              <span>{deltaIcon}</span>
              <span>{delta.value}</span>
            </div>
          ) : null}
        </div>
        {sideMetrics && sideMetrics.length ? (
          <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-xs text-muted-foreground">
            {sideMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-2 whitespace-nowrap">
                <span>{metric.label}</span>
                <span className="font-semibold text-foreground">{metric.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
