import SalesDashboardClient from "./sales-dashboard-client";
import { getAbandonedCarts, getHomeRuns, getQuotes, getSalesRecords } from "@/lib/data-service";

export default async function SalesDashboard() {
  const [salesResult, quotesResult, abandonedResult, homeRunsResult] = await Promise.all([
    getSalesRecords(),
    getQuotes(),
    getAbandonedCarts(),
    getHomeRuns(),
  ]);

  return (
    <SalesDashboardClient
      sales={salesResult.data ?? []}
      quotes={quotesResult.data ?? []}
      abandonedCarts={abandonedResult.data ?? []}
      homeRuns={homeRunsResult.data ?? []}
    />
  );
}
