"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_SECTIONS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-card/90 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="sticky top-0 flex h-16 items-center gap-3 border-b border-border/80 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-card">
          S4
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Source 4
          </span>
          <span className="text-sm font-semibold leading-tight">Console</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <li key={section.title}>
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </div>
              <ul className="flex flex-col gap-0.5">
                {section.items.filter(item => item.status !== "future").map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/80 hover:bg-muted/40 hover:text-foreground",
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border/80 px-3 py-3">
        <p className="text-xs text-muted-foreground">Dashboard v1.0</p>
      </div>
    </aside>
  );
}
