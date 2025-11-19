"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QuickLink = {
  title: string;
  description: string;
  href: string;
  badge?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  prefetch?: boolean;
};

type QuickSection = {
  title: string;
  description: string;
  links: QuickLink[];
};

type LandingDashboardClientProps = {
  spotlight: QuickLink;
  sections: QuickSection[];
};

export default function LandingDashboardClient({ spotlight, sections }: LandingDashboardClientProps) {
  const router = useRouter();

  useEffect(() => {
    const uniqueHrefs = new Set<string>([
      spotlight.href,
      ...sections.flatMap((section) => section.links.filter((link) => link.prefetch).map((link) => link.href)),
    ]);

    uniqueHrefs.forEach((href) => {
      router.prefetch(href);
    });
  }, [router, sections, spotlight.href]);

  const SpotlightIcon = spotlight.icon ?? Gauge;

  const handleSpotlightClick = useCallback(() => {
    router.push(spotlight.href);
  }, [router, spotlight.href]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/95 via-card to-card/90 p-8 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <SpotlightIcon className="h-3.5 w-3.5" />
              Command Center
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back — choose where to focus first.</h1>
            <p className="text-base text-muted-foreground">
              Start from a lightweight overview, then jump into the deep-dive dashboards once you&apos;re ready.
              We prefetch the heavy views so they load instantly when you need them.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Button
              onClick={handleSpotlightClick}
              className="flex w-full items-center justify-center gap-2 whitespace-nowrap lg:w-auto"
            >
              Go to {spotlight.title}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {spotlight.badge ? (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                {spotlight.badge}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} padding="lg">
            <CardHeader className="flex-col items-start gap-2">
              <CardTitle className="text-xl">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-3">
              {section.links.map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group flex items-start gap-3 rounded-lg border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-muted/40",
                    )}
                  >
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/15">
                      <LinkIcon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {link.title}
                        {link.badge ? (
                          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            {link.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{link.description}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
