import { ShopifyDashboardClient } from "./shopify-dashboard-client";
import {
  getShopifyDailySales,
  getShopifyOrders,
  getShopifyProductSales,
  getShopifyCustomers,
  getShopifySummaryStats,
} from "@/lib/data-service";

export default async function ShopifyDashboard() {
  const [
    dailySales,
    recentOrders,
    topProducts,
    topCustomers,
    summaryStats,
  ] = await Promise.all([
    getShopifyDailySales(),
    getShopifyOrders(undefined, 100),
    getShopifyProductSales(50),
    getShopifyCustomers(50),
    getShopifySummaryStats(),
  ]);

  return (
    <ShopifyDashboardClient
      dailySales={dailySales}
      recentOrders={recentOrders}
      topProducts={topProducts}
      topCustomers={topCustomers}
      summaryStats={summaryStats}
    />
  );
}
