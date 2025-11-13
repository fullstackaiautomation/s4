import { HomeRunsClient } from "./home-runs-client";
import { getHomeRuns } from "@/lib/data-service";

export default async function HomeRunsPage() {
  const homeRunsResult = await getHomeRuns();

  return <HomeRunsClient records={homeRunsResult.data} refreshedAt={homeRunsResult.refreshedAt} />;
}
