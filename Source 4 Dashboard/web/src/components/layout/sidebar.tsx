"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Sun, Moon, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Role } from "@/lib/auth/roles";
import { getRoleLabel } from "@/lib/auth/roles";
import { getNavSectionsForRole } from "@/lib/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: Role;
  userEmail: string;
};

export function Sidebar({ role, userEmail }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sections = useMemo(() => getNavSectionsForRole(role), [role]);
  const sectionTitles = useMemo(() => sections.map((section) => section.title), [sections]);
  const [expandedSections, setExpandedSections] = useState<string[]>(sectionTitles);

  useEffect(() => {
    setExpandedSections(sectionTitles);
  }, [sectionTitles]);

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
        "hidden shrink-0 border-r border-border/60 bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300 sticky top-0 h-screen",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 bg-card/50 backdrop-blur-md px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white shadow-lg">
            <Image src="/favicon.png" alt="S4 Logo" fill className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Performance Dashboard
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {sections.map((section, sectionIndex) => {
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

      {/* User Info & Theme Toggle - condensed into one row */}
      <div className="border-t border-border/60 p-3 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}