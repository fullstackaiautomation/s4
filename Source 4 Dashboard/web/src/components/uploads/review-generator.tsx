"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ReviewsBlueprint } from "@/lib/types";

type GeneratedReview = {
  productId: string;
  persona: string;
  content: string;
};

type ReviewGeneratorProps = {
  blueprints: ReviewsBlueprint[];
};

const personas = [
  "Facilities Manager",
  "Operations Director",
  "Procurement Lead",
];

export function ReviewGenerator({ blueprints }: ReviewGeneratorProps) {
  const [generated, setGenerated] = useState<GeneratedReview[]>([]);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  const blueprintMap = useMemo(() => {
    const map = new Map<string, ReviewsBlueprint>();
    blueprints.forEach((blueprint) => map.set(blueprint.productId, blueprint));
    return map;
  }, [blueprints]);

  const handleGenerate = async (productId: string) => {
    const blueprint = blueprintMap.get(productId);
    if (!blueprint) return;
    setStatus("generating");
    setNotice(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const persona = blueprint.targetPersona ?? personas[Math.floor(Math.random() * personas.length)];
    const benefits = blueprint.keyBenefits.join(" and ");
    const content = `As a ${persona.toLowerCase()}, I needed a solution that delivered on ${benefits.toLowerCase()}. After installing the ${blueprint.productName}, our team immediately noticed the difference—reliable performance, effortless setup, and a noticeable boost in productivity. I recommend it to any organization looking for dependable results.`;

    setGenerated((prev) => [{ productId, persona, content }, ...prev]);
    setStatus("idle");
    setNotice("Review draft generated. Copy into your CMS or export as needed.");
  };

  return (
    <div className="space-y-6">
      {notice ? <InlineAlert title="Review ready" message={notice} variant="success" /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {blueprints.map((blueprint) => (
          <div key={blueprint.productId} className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 shadow-subtle">
            <div>
              <div className="text-sm font-semibold">{blueprint.productName}</div>
              <div className="text-xs text-muted-foreground">SKU {blueprint.productId}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Voice: {blueprint.tone} • Persona: {blueprint.targetPersona}
            </div>
            <div className="text-xs text-muted-foreground">Key benefits:</div>
            <ul className="list-disc pl-4 text-xs text-muted-foreground">
              {blueprint.keyBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" onClick={() => handleGenerate(blueprint.productId)} disabled={status === "generating"}>
              {status === "generating" ? "Drafting..." : "Generate Review"}
            </Button>
          </div>
        ))}
      </div>

      {generated.length ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Generated Reviews</h3>
          <div className="space-y-4">
            {generated.map((review) => (
              <div key={`${review.productId}-${review.content.slice(0, 12)}`} className="rounded-lg border border-border/70 bg-card/70 p-4 text-sm shadow-subtle">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">
                  SKU {review.productId} • Persona: {review.persona}
                </div>
                <p className="leading-relaxed text-foreground">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
