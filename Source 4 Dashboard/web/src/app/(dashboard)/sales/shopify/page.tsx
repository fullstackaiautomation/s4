import { Metadata } from "next";
import ShopifyDashboard from "./shopify-dashboard";

export const metadata: Metadata = {
  title: "Shopify Sales - Source 4 Industries",
};

export const dynamic = "force-dynamic";

export default function ShopifyDashboardPage() {
  return <ShopifyDashboard />;
}
