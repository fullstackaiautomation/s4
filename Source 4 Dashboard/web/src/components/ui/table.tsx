import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className={cn("w-full border-collapse bg-card text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentPropsWithoutRef<"thead">) {
  return <thead className={cn("bg-muted/60 text-left text-xs uppercase tracking-wide", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={cn("divide-y divide-border/70", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) {
  return <tr className={cn("transition-colors hover:bg-muted/40", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

export function TableHeadCell({ className, ...props }: React.ComponentPropsWithoutRef<"th">) {
  return <th className={cn("px-4 py-3 font-semibold", className)} {...props} />;
}
