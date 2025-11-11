import {
  OperationalAlert,
  Quote,
  SkuRecord,
  TimeSeriesPoint,
  ReviewsBlueprint,
} from "./types";
import {
  SAMPLE_ALERTS,
  SAMPLE_QUOTES,
  SAMPLE_SKUS,
} from "./sample-data";

export type ApiResponse<T> = {
  data: T;
  error?: string;
};

// Operational Alerts
export async function getOperationalAlerts(): Promise<ApiResponse<OperationalAlert[]>> {
  return { data: SAMPLE_ALERTS };
}

// Quotes
export async function getQuotes(): Promise<ApiResponse<Quote[]>> {
  return { data: SAMPLE_QUOTES };
}

// SKU Master
export async function getSkuMaster(): Promise<ApiResponse<SkuRecord[]>> {
  return { data: SAMPLE_SKUS };
}

// Abandoned Carts
export async function getAbandonedCarts(): Promise<
  ApiResponse<{ id: string; customer: string; value: number; date: string }[]>
> {
  return {
    data: [
      { id: "1", customer: "Customer A", value: 299.99, date: "2024-11-10" },
      { id: "2", customer: "Customer B", value: 599.99, date: "2024-11-09" },
    ],
  };
}

// Home Runs
export async function getHomeRuns(): Promise<
  ApiResponse<{ id: string; product: string; sales: number; date: string }[]>
> {
  return {
    data: [
      { id: "1", product: "Product A", sales: 15000, date: "2024-11-10" },
      { id: "2", product: "Product B", sales: 22000, date: "2024-11-09" },
    ],
  };
}

// Sales Snapshots
export async function getSalesSnapshots(): Promise<ApiResponse<TimeSeriesPoint[]>> {
  return {
    data: [
      { date: "Nov 1", value: 45000, secondary: 32000 },
      { date: "Nov 2", value: 52000, secondary: 38000 },
      { date: "Nov 3", value: 48000, secondary: 35000 },
      { date: "Nov 4", value: 61000, secondary: 44000 },
      { date: "Nov 5", value: 55000, secondary: 40000 },
      { date: "Nov 6", value: 67000, secondary: 48000 },
      { date: "Nov 7", value: 72000, secondary: 52000 },
    ],
  };
}

// Blog Insights
export async function getBlogInsights(): Promise<
  ApiResponse<{ date: string; views: number; engagement: number }[]>
> {
  return {
    data: [
      { date: "Nov 1", views: 1200, engagement: 240 },
      { date: "Nov 2", views: 1900, engagement: 380 },
      { date: "Nov 3", views: 1500, engagement: 300 },
    ],
  };
}

// Opportunity Keywords
export async function getOpportunityKeywords(): Promise<ApiResponse<string[]>> {
  return {
    data: ["keyword1", "keyword2", "keyword3"],
  };
}

// Ads Performance
export async function getAdsPerformance(): Promise<
  ApiResponse<{ campaign: string; spend: number; roi: number }[]>
> {
  return {
    data: [
      { campaign: "Campaign A", spend: 5000, roi: 2.5 },
      { campaign: "Campaign B", spend: 8000, roi: 3.2 },
    ],
  };
}

// Ads Timeseries
export async function getAdsTimeseries(): Promise<ApiResponse<TimeSeriesPoint[]>> {
  return {
    data: [
      { date: "Nov 1", value: 5000 },
      { date: "Nov 2", value: 6200 },
      { date: "Nov 3", value: 5800 },
      { date: "Nov 4", value: 7100 },
      { date: "Nov 5", value: 6900 },
    ],
  };
}

// Automation Projects
export async function getAutomationProjects(): Promise<
  ApiResponse<{ id: string; name: string; status: string; progress: number }[]>
> {
  return {
    data: [
      { id: "1", name: "Project A", status: "active", progress: 75 },
      { id: "2", name: "Project B", status: "completed", progress: 100 },
    ],
  };
}

// Automations
export async function getAutomations(): Promise<
  ApiResponse<{ id: string; name: string; enabled: boolean; lastRun: string }[]>
> {
  return {
    data: [
      { id: "1", name: "Automation 1", enabled: true, lastRun: "2024-11-10T10:30:00" },
      { id: "2", name: "Automation 2", enabled: true, lastRun: "2024-11-10T09:15:00" },
    ],
  };
}

// Lifecycle Performance
export async function getLifecyclePerformance(): Promise<
  ApiResponse<{ stage: string; count: number; value: number }[]>
> {
  return {
    data: [
      { stage: "Awareness", count: 5000, value: 0 },
      { stage: "Consideration", count: 2500, value: 0 },
      { stage: "Purchase", count: 1000, value: 250000 },
    ],
  };
}

// Review Blueprints
export async function getReviewBlueprints(): Promise<ApiResponse<ReviewsBlueprint[]>> {
  return {
    data: [
      {
        id: "1",
        name: "Blueprint A",
        description: "Sample blueprint",
        prompts: ["prompt1", "prompt2"],
      },
    ],
  };
}
