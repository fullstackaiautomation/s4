import { Metadata } from "next";
import SalesDashboard from "./sales-dashboard";

export const metadata: Metadata = {
  title: "Source 4 Industries Performance Dashboard",
};

// ISR: Pre-render page and revalidate every 5 minutes
// First visit after revalidation period triggers background refresh
export const revalidate = 300;

export default function SalesDashboardPage() {
  return <SalesDashboard />;
}
