import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MonthlyDashboardUploader } from "@/components/uploads/monthly-dashboard-uploader";

export default function MonthlyDashboardPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        title="Monthly Dashboard Upload"
        description="Upload CBOS and paid media exports to refresh executive dashboards. Files are validated, normalized, and synced to Supabase."
        badge="Data Ops"
      />

      <InlineAlert
        title="Guidance"
        message="Export files in CSV format, ensure column headers remain unchanged, and remove summary rows prior to upload."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Upload Wizard</CardTitle>
            <CardDescription>Attach the three required files, then process to trigger the ingestion pipeline.</CardDescription>
          </div>
        </CardHeader>
        <MonthlyDashboardUploader />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Processing Steps</CardTitle>
            <CardDescription>What happens after submission.</CardDescription>
          </div>
        </CardHeader>
        <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Files are stored in Supabase storage with timestamped folder names.</li>
          <li>Edge Function transforms raw CSVs into staging tables and logs validation results.</li>
          <li>Materialized views refresh for dashboards; alerts trigger if metrics drift &gt; 5% versus prior month.</li>
        </ol>
      </Card>
    </div>
  );
}
