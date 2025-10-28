import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, badge, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {badge ? <Badge>{badge}</Badge> : null}
        </div>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
