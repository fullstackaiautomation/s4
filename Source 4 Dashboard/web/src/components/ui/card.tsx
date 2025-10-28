import { cn } from "@/lib/utils";

type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  padding?: "none" | "sm" | "md" | "lg";
};

export function Card({ className, padding = "md", ...props }: CardProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "p-4 sm:p-5"
        : padding === "lg"
          ? "p-8"
          : "p-6";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/95 shadow-card backdrop-blur-sm transition-shadow hover:shadow-lg",
        paddingClass,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardMetrics({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)} {...props} />;
}
