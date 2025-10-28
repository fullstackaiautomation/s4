"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_SECTIONS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium shadow-subtle"
        onClick={() => setOpen(true)}
      >
        ☰ Menu
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[80%] bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="text-base font-semibold">Source 4 Dashboard</div>
              <button
                type="button"
                className="rounded-md border border-border bg-muted px-3 py-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
              <ul className="space-y-6">
                {NAV_SECTIONS.map((section) => (
                  <li key={section.title}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.status === "future" ? "#" : item.href}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm font-medium",
                              pathname.startsWith(item.href)
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted/60",
                              item.status === "future" ? "pointer-events-none opacity-50" : "",
                            )}
                            onClick={() => setOpen(false)}
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
