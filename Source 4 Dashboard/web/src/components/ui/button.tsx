import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary",
  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-secondary",
  ghost: "hover:bg-muted text-muted-foreground",
  outline:
    "border border-border bg-card text-foreground hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/60",
  danger:
    "bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
