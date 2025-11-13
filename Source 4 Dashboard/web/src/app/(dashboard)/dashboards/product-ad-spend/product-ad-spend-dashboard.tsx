import { ProductAdSpendDashboardClient } from "./product-ad-spend-dashboard-client";
import {
  getSkuAdSpendCategorySummary,
  getSkuAdSpendMonthlySummary,
  getSkuAdSpendTopSkus,
  getSkuAdSpendVendorSummary,
} from "@/lib/data-service";

export default async function ProductAdSpendDashboard() {
  const monthlySummary = await getSkuAdSpendMonthlySummary();
  const [vendorSummary, categorySummary, topSkus] = await Promise.all([
    getSkuAdSpendVendorSummary(),
    getSkuAdSpendCategorySummary(),
    getSkuAdSpendTopSkus(20),
  ]);

  return (
    <ProductAdSpendDashboardClient
      monthlySummary={monthlySummary}
      vendorSummary={vendorSummary}
      categorySummary={categorySummary}
      topSkus={topSkus}
    />
  );
}
