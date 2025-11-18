import { GA4DashboardClient } from "./ga4-dashboard-client";
import {
  getGA4DailyTraffic,
  getGA4TrafficSources,
  getGA4PagePerformance,
  getGA4Conversions,
  getGA4EcommerceTransactions,
} from "@/lib/data-service";

export default async function GA4Dashboard() {
  const [
    dailyTraffic,
    trafficSources,
    pagePerformance,
    conversions,
    ecommerceTransactions,
  ] = await Promise.all([
    getGA4DailyTraffic(),
    getGA4TrafficSources(),
    getGA4PagePerformance(),
    getGA4Conversions(),
    getGA4EcommerceTransactions(),
  ]);

  return (
    <GA4DashboardClient
      dailyTraffic={dailyTraffic}
      trafficSources={trafficSources}
      pagePerformance={pagePerformance}
      conversions={conversions}
      ecommerceTransactions={ecommerceTransactions}
    />
  );
}
