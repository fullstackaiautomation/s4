import SalesDashboardClient from "./sales-dashboard-client";
import { getAbandonedCarts, getHomeRuns, getSalesRecords, getSalesSnapshots } from "@/lib/data-service";

export default async function SalesDashboard() {
  const [salesResult, abandonedResult, homeRunsResult, snapshotsResult] = await Promise.all([
    getSalesRecords(),
    getAbandonedCarts(),
    getHomeRuns(),
    getSalesSnapshots(),
  ]);

  return (
    <SalesDashboardClient
      sales={salesResult.data ?? []}
      abandonedCarts={abandonedResult.data ?? []}
      homeRuns={homeRunsResult.data ?? []}
      snapshots={snapshotsResult.data ?? []}
    />
  );
}
