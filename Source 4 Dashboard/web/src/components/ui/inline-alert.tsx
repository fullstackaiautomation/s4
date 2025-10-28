import { cn } from "@/lib/utils";

type InlineAlertProps = {
  title?: string;
  message: string;
  variant?: "info" | "warning" | "success";
};

const variantStyles: Record<NonNullable<InlineAlertProps["variant"]>, string> = {
  info: "border-primary/40 bg-primary/5 text-primary",
  warning: "border-warning/40 bg-warning/5 text-warning",
  success: "border-success/40 bg-success/5 text-success",
};

export function InlineAlert({ title, message, variant = "info" }: InlineAlertProps) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm shadow-subtle", variantStyles[variant])}>
      {title ? <span className="font-semibold uppercase tracking-wide text-xs">{title}</span> : null}
      <span>{message}</span>
    </div>
  );
}
