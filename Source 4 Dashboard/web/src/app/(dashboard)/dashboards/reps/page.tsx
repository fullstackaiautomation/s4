import { RepsDashboardClient } from "./reps-dashboard-client";
import { getAbandonedCarts, getHomeRuns, getQuotes, getSalesSnapshots } from "@/lib/data-service";

export default async function RepsDashboardPage() {
  const [snapshotsResult, quotesResult, cartsResult, homeRunsResult] = await Promise.all([
    getSalesSnapshots(),
    getQuotes(),
    getAbandonedCarts(),
    getHomeRuns(),
  ]);

  return (
    <RepsDashboardClient
      snapshots={snapshotsResult.data}
      quotes={quotesResult.data}
      carts={cartsResult.data}
      homeRuns={homeRunsResult.data}
    />
  );
}
