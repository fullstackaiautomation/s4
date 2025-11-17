import { Metadata } from "next";
import SalesDashboard from "./sales-dashboard";

export const metadata: Metadata = {
  title: "Source 4 Industries Performance Dashboard",
};

export const dynamic = "force-dynamic";

export default function SalesDashboardPage() {
  return <SalesDashboard />;
}
