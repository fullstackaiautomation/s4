import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SkuMasterTable } from "@/components/admin/sku-master-table";
import { getSkuMaster } from "@/lib/data-service";

export default async function SkuMasterPage() {
  const skuResult = await getSkuMaster();
  const { data: skus, warning, source } = skuResult;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="SKU Master"
        description="Centralize SKU metadata, pricing, and availability for Source 4 vendors."
        badge="Admin"
      />

      {source === "sample" || warning ? (
        <InlineAlert
          message={warning ?? "Displaying sample SKUs until Supabase inventory sync is configured."}
          variant={warning ? "warning" : "info"}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>Search, filter, and inspect the active SKU catalog.</CardDescription>
          </div>
        </CardHeader>
        <SkuMasterTable records={skus} />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Roadmap Notes</CardTitle>
            <CardDescription>Planned enhancements for SKU management.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Bulk edit support with CSV import/export.</li>
          <li>• Vendor-specific price lists and discount tiers.</li>
          <li>• Direct sync with ERP/PIM systems for availability status.</li>
        </ul>
      </Card>
    </div>
  );
}
