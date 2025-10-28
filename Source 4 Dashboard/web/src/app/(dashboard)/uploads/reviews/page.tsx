import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ReviewGenerator } from "@/components/uploads/review-generator";
import { getReviewBlueprints } from "@/lib/data-service";

export default async function ReviewsUploadPage() {
  const blueprintsResult = await getReviewBlueprints();
  const { data: blueprints, warning, source } = blueprintsResult;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Reviews Generator"
        description="Upload product lists and generate pre-approved reviews tailored to Source 4 personas."
        badge="Automation"
      />

      <InlineAlert
        title="Reminder"
        message="Export the SKU list you want to enrich, then generate reviews here before pushing to Shopify or Klaviyo."
      />

      {source === "sample" || warning ? (
        <InlineAlert
          message={warning ?? "Using sample review blueprints until Supabase table is populated."}
          variant={warning ? "warning" : "info"}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Blueprints</CardTitle>
            <CardDescription>Select a blueprint to generate a persona-specific review draft.</CardDescription>
          </div>
        </CardHeader>
        <ReviewGenerator blueprints={blueprints} />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Export Steps</CardTitle>
            <CardDescription>Finalize copy and ship to your storefront.</CardDescription>
          </div>
        </CardHeader>
        <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Review generated drafts and edit tone or key benefits if needed.</li>
          <li>Copy approved reviews into your ecommerce CMS or export to CSV for bulk import.</li>
          <li>Notify marketing once reviews are live to include in lifecycle campaigns.</li>
        </ol>
      </Card>
    </div>
  );
}
