import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "warning" | "success" | "danger";

const variantClassMap: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  outline: "border border-border bg-transparent text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
};

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variantClassMap[variant],
        className,
      )}
      {...props}
    />
  );
}
