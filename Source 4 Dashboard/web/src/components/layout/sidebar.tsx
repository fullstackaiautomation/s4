"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { NAV_SECTIONS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    NAV_SECTIONS.map((section) => section.title)
  );

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border/60 bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/60 bg-card/50 backdrop-blur-md px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            S4
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Source 4
              </span>
              <span className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Industries
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_SECTIONS.map((section, sectionIndex) => {
            const isExpanded = expandedSections.includes(section.title);
            const SectionIcon = section.icon;

            return (
              <li key={section.title}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                    "hover:bg-muted/30 group",
                    sectionIndex > 0 && "mt-4"
                  )}
                >
                  {SectionIcon && (
                    <SectionIcon
                      className={cn(
                        "h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors",
                        isCollapsed && "mx-auto"
                      )}
                    />
                  )}
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground transition-colors">
                        {section.title}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Section Items */}
                {(!isCollapsed || isExpanded) && (
                  <ul
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0",
                      isCollapsed && "mt-1",
                      !isCollapsed && "ml-6" // Add left margin for indentation when not collapsed
                    )}
                  >
                    {section.items
                      .filter((item) => item.status !== "future")
                      .map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const ItemIcon = item.icon;

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                isActive
                                  ? "bg-primary/10 text-primary shadow-sm"
                                  : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
                                isCollapsed && "justify-center px-2"
                              )}
                              title={isCollapsed ? item.title : undefined}
                            >
                              {ItemIcon && (
                                <ItemIcon
                                  className={cn(
                                    "h-4 w-4 transition-colors",
                                    isActive
                                      ? "text-primary"
                                      : "text-muted-foreground group-hover:text-foreground"
                                  )}
                                />
                              )}
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1 truncate">{item.title}</span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 text-xs font-medium rounded-full",
                                        item.badge === "New"
                                          ? "bg-green-500/10 text-green-500"
                                          : "bg-primary/10 text-primary"
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.status === "beta" && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">
                                      Beta
                                    </span>
                                  )}
                                </>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 p-3">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Version 2.0</p>
            <p className="text-xs text-muted-foreground/60">© 2025 Source 4 Industries</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">v2.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}