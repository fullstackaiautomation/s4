import { RepsDashboardClient } from "./reps-dashboard-client";
import { getAbandonedCarts, getHomeRuns, getSalesRecords } from "@/lib/data-service";

export default async function RepsDashboardPage() {
  const [salesResult, cartsResult, homeRunsResult] = await Promise.all([
    getSalesRecords(),
    getAbandonedCarts(),
    getHomeRuns(),
  ]);

  return (
    <RepsDashboardClient
      sales={salesResult.data ?? []}
      carts={cartsResult.data ?? []}
      homeRuns={homeRunsResult.data ?? []}
    />
  );
}
