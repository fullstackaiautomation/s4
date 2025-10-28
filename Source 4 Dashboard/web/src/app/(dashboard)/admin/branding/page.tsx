import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

export default function BrandingPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Branding Settings"
        description="Configure Source 4 visual identity across dashboards and exports."
        badge="Coming Soon"
      />

      <InlineAlert
        title="Planned Feature"
        message="Brand assets, theming controls, and white-label options will be available in Phase 2."
        variant="info"
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Roadmap Preview</CardTitle>
            <CardDescription>Outline of upcoming branding capabilities.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Upload logos, favicons, and color palettes to align with Source 4 identity.</li>
          <li>• Configure email and PDF export headers with approved branding.</li>
          <li>• Manage dark/light mode variants and vendor-specific themes.</li>
        </ul>
      </Card>
    </div>
  );
}
