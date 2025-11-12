/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { supabase } from "./supabase/client";

export type ApiResponse<T> = {
  data: T;
  error?: string;
  refreshedAt?: string;
  source?: "supabase" | "sample";
  warning?: string;
};

export type SalesRecord = {
  id: string;
  date: string;
  vendor: string;
  rep: string;
  invoiceTotal: number;
  salesTotal: number;
  orders: number;
  orderQuantity: number;
};

// Operational Alerts
export async function getOperationalAlerts(): Promise<ApiResponse<OperationalAlert[]>> {
  return { data: SAMPLE_ALERTS };
}

const SAMPLE_SALES_RECORDS: SalesRecord[] = [
  {
    id: "sample-1",
    date: new Date().toISOString(),
    vendor: "Vendor A",
    rep: "Alice Johnson",
    invoiceTotal: 45000,
    salesTotal: 45000,
    orders: 24,
    orderQuantity: 24,
  },
  {
    id: "sample-2",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: "Vendor B",
    rep: "Bob Smith",
    invoiceTotal: 52000,
    salesTotal: 52000,
    orders: 28,
    orderQuantity: 28,
  },
  {
    id: "sample-3",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: "Vendor C",
    rep: "Carol Davis",
    invoiceTotal: 61000,
    salesTotal: 61000,
    orders: 33,
    orderQuantity: 33,
  },
  {
    id: "sample-4",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: "Vendor A",
    rep: "Alice Johnson",
    invoiceTotal: 55000,
    salesTotal: 55000,
    orders: 29,
    orderQuantity: 29,
  },
  {
    id: "sample-5",
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: "Vendor B",
    rep: "Bob Smith",
    invoiceTotal: 67000,
    salesTotal: 67000,
    orders: 36,
    orderQuantity: 36,
  },
];

export async function getSalesRecords(limit = 6000): Promise<ApiResponse<SalesRecord[]>> {
  try {
    const { data, error } = await supabase
      .from("all_time_sales")
      .select("id, date, vendor, rep, invoice_total, sales_total, orders, order_quantity")
      .order("date", { ascending: true })
      .limit(limit);

    if (error) {
      console.warn("Supabase error fetching sales records:", error);
      return {
        data: SAMPLE_SALES_RECORDS,
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    if (!data || data.length === 0) {
      return {
        data: SAMPLE_SALES_RECORDS,
        source: "sample",
        warning: "No sales records returned from Supabase",
        refreshedAt: new Date().toISOString(),
      };
    }

    const records: SalesRecord[] = data.map((row, index) => {
      const rawDate = row.date as string | null;
      const parsedDate = rawDate ? new Date(rawDate) : null;

      return {
        id: (row.id as string) ?? `record-${index}`,
        date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
        vendor: (row.vendor as string) || "Unknown Vendor",
        rep: (row.rep as string) || "Unknown Rep",
        invoiceTotal: Number(row.invoice_total ?? row.sales_total ?? 0) || 0,
        salesTotal: Number(row.sales_total ?? row.invoice_total ?? 0) || 0,
        orders: Number(row.orders ?? row.order_quantity ?? 0) || 0,
        orderQuantity: Number(row.order_quantity ?? row.orders ?? 0) || 0,
      };
    });

    return {
      data: records,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching sales records:", error);
    return {
      data: SAMPLE_SALES_RECORDS,
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
}

// Quotes
export async function getQuotes(): Promise<ApiResponse<Quote[]> & { refreshedAt: string }> {
  return { data: SAMPLE_QUOTES, refreshedAt: new Date().toISOString() };
}

// SKU Master
export async function getSkuMaster(): Promise<ApiResponse<SkuRecord[]>> {
  return { data: SAMPLE_SKUS };
}

// Abandoned Carts
export async function getAbandonedCarts(): Promise<
  ApiResponse<
    Array<{
      id: string;
      customer: string;
      value: number;
      date: string;
      createdAt: string;
      rep: string;
      vendor: string;
      status: "open" | "contacted" | "recovered";
      daysSinceAbandoned: number;
    }>
  > & { refreshedAt: string }
> {
  return {
    data: [
      {
        id: "1",
        customer: "Customer A",
        value: 299.99,
        date: "2024-11-10",
        createdAt: "2024-11-10",
        rep: "Alice Johnson",
        vendor: "Vendor X",
        status: "open",
        daysSinceAbandoned: 1,
      },
      {
        id: "2",
        customer: "Customer B",
        value: 599.99,
        date: "2024-11-09",
        createdAt: "2024-11-09",
        rep: "Bob Smith",
        vendor: "Vendor Y",
        status: "contacted",
        daysSinceAbandoned: 2,
      },
      {
        id: "3",
        customer: "Customer C",
        value: 899.99,
        date: "2024-11-08",
        createdAt: "2024-11-08",
        rep: "Carol Davis",
        vendor: "Vendor Z",
        status: "open",
        daysSinceAbandoned: 3,
      },
      {
        id: "4",
        customer: "Customer D",
        value: 1299.99,
        date: "2024-11-07",
        createdAt: "2024-11-07",
        rep: "Alice Johnson",
        vendor: "Vendor X",
        status: "recovered",
        daysSinceAbandoned: 4,
      },
    ],
    refreshedAt: new Date().toISOString(),
  };
}

// Home Runs
export async function getHomeRuns(): Promise<
  ApiResponse<
    Array<{
      id: string;
      product: string;
      sales: number;
      date: string;
      value: number;
      vendor: string;
      invoice: string;
      rep: string;
      closedAt: string;
    }>
  > & { refreshedAt: string }
> {
  const fallback = {
    data: [
      {
        id: "1",
        product: "Enterprise License Pack",
        sales: 15000,
        date: "2024-11-10",
        value: 85000,
        vendor: "TechCorp",
        invoice: "INV-2024-001",
        rep: "Alice Johnson",
        closedAt: "2024-11-10",
        closedAtIso: new Date("2024-11-10").toISOString(),
      },
      {
        id: "2",
        product: "Custom Integration Suite",
        sales: 22000,
        date: "2024-11-09",
        value: 125000,
        vendor: "DataSystems Inc",
        invoice: "INV-2024-002",
        rep: "Bob Smith",
        closedAt: "2024-11-09",
        closedAtIso: new Date("2024-11-09").toISOString(),
      },
      {
        id: "3",
        product: "Premium Support Contract",
        sales: 18000,
        date: "2024-11-08",
        value: 95000,
        vendor: "CloudVendor",
        invoice: "INV-2024-003",
        rep: "Carol Davis",
        closedAt: "2024-11-08",
        closedAtIso: new Date("2024-11-08").toISOString(),
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("all_time_sales")
      .select("invoice_number, vendor, rep, invoice_total, sales_total, date, description")
      .not("invoice_number", "is", null)
      .order("invoice_total", { ascending: false })
      .limit(2000);

    if (error) {
      console.warn("Supabase error fetching home runs:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      return fallback;
    }

    type InvoiceAggregate = {
      invoice: string;
      vendor: string;
      rep: string;
      value: number;
      closedAt: string;
      closedAtIso: string;
      product: string;
      sales: number;
    };

    const aggregate = new Map<string, InvoiceAggregate>();

    const formatDate = (value: string | null) => {
      if (!value) return "Unknown";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "Unknown";
      return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    data.forEach((row, index) => {
      const invoice = (row.invoice_number as string) ?? `unknown-${index}`;
      if (!aggregate.has(invoice)) {
        const isoDate = (() => {
          const raw = row.date as string | null;
          if (!raw) return new Date().toISOString();
          const parsed = new Date(raw);
          return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        })();

        aggregate.set(invoice, {
          invoice,
          vendor: (row.vendor as string) || "Unknown Vendor",
          rep: (row.rep as string) || "Unknown Rep",
          value: 0,
          closedAt: formatDate(row.date as string | null),
          closedAtIso: isoDate,
          product: (row.description as string) || "High-Value Order",
          sales: 0,
        });
      }

      const entry = aggregate.get(invoice)!;
      const lineRevenue = Number(row.sales_total ?? row.invoice_total ?? 0) || 0;
      entry.value += lineRevenue;
      entry.sales += lineRevenue;
      if (!entry.product && row.description) {
        entry.product = row.description as string;
      }
      if (!entry.vendor && row.vendor) {
        entry.vendor = row.vendor as string;
      }
      if (!entry.rep && row.rep) {
        entry.rep = row.rep as string;
      }
    });

    const homeRuns = Array.from(aggregate.values())
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, idx) => ({
        id: `${item.invoice}-${idx}`,
        product: item.product,
        sales: item.sales,
        date: item.closedAt,
        value: item.value,
        vendor: item.vendor,
        invoice: item.invoice,
        rep: item.rep,
        closedAt: item.closedAt,
        closedAtIso: item.closedAtIso,
      }));

    if (homeRuns.length === 0) {
      return fallback;
    }

    return {
      data: homeRuns,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching home runs:", error);
    return fallback;
  }
}

// Sales Snapshots
export async function getSalesSnapshots(): Promise<
  ApiResponse<Array<TimeSeriesPoint & { topReps: Array<{ name: string; revenue: number }> }>>
> {
  const sampleData: Array<TimeSeriesPoint & { topReps: Array<{ name: string; revenue: number }> }> = [
    {
      date: "Nov 1",
      value: 45000,
      secondary: 32000,
      revenue: 45000,
      orders: 24,
      avgOrderValue: 1875,
      topVendors: [
        { name: "Vendor A", revenue: 28000 },
        { name: "Vendor B", revenue: 17000 },
      ],
      topReps: [
        { name: "Alice Johnson", revenue: 15000 },
        { name: "Bob Smith", revenue: 12000 },
        { name: "Carol Davis", revenue: 18000 },
      ],
    },
    {
      date: "Nov 2",
      value: 52000,
      secondary: 38000,
      revenue: 52000,
      orders: 28,
      avgOrderValue: 1857,
      topVendors: [
        { name: "Vendor B", revenue: 32000 },
        { name: "Vendor C", revenue: 20000 },
      ],
      topReps: [
        { name: "Bob Smith", revenue: 18000 },
        { name: "Alice Johnson", revenue: 16000 },
        { name: "Carol Davis", revenue: 18000 },
      ],
    },
    {
      date: "Nov 3",
      value: 48000,
      secondary: 35000,
      revenue: 48000,
      orders: 26,
      avgOrderValue: 1846,
      topVendors: [
        { name: "Vendor A", revenue: 25000 },
        { name: "Vendor C", revenue: 23000 },
      ],
      topReps: [
        { name: "Carol Davis", revenue: 20000 },
        { name: "Alice Johnson", revenue: 14000 },
        { name: "Bob Smith", revenue: 14000 },
      ],
    },
    {
      date: "Nov 4",
      value: 61000,
      secondary: 44000,
      revenue: 61000,
      orders: 33,
      avgOrderValue: 1848,
      topVendors: [
        { name: "Vendor C", revenue: 35000 },
        { name: "Vendor A", revenue: 26000 },
      ],
      topReps: [
        { name: "Alice Johnson", revenue: 22000 },
        { name: "Bob Smith", revenue: 20000 },
        { name: "Carol Davis", revenue: 19000 },
      ],
    },
    {
      date: "Nov 5",
      value: 55000,
      secondary: 40000,
      revenue: 55000,
      orders: 29,
      avgOrderValue: 1897,
      topVendors: [
        { name: "Vendor B", revenue: 29000 },
        { name: "Vendor A", revenue: 26000 },
      ],
      topReps: [
        { name: "Bob Smith", revenue: 20000 },
        { name: "Carol Davis", revenue: 18000 },
        { name: "Alice Johnson", revenue: 17000 },
      ],
    },
    {
      date: "Nov 6",
      value: 67000,
      secondary: 48000,
      revenue: 67000,
      orders: 36,
      avgOrderValue: 1861,
      topVendors: [
        { name: "Vendor A", revenue: 28000 },
        { name: "Vendor B", revenue: 17000 },
      ],
      topReps: [
        { name: "Carol Davis", revenue: 25000 },
        { name: "Alice Johnson", revenue: 22000 },
        { name: "Bob Smith", revenue: 20000 },
      ],
    },
    {
      date: "Nov 7",
      value: 72000,
      secondary: 52000,
      revenue: 72000,
      orders: 38,
      avgOrderValue: 1895,
      topVendors: [
        { name: "Vendor C", revenue: 38000 },
        { name: "Vendor B", revenue: 34000 },
      ],
      topReps: [
        { name: "Alice Johnson", revenue: 26000 },
        { name: "Bob Smith", revenue: 23000 },
        { name: "Carol Davis", revenue: 23000 },
      ],
    },
  ];

  const getFallbackResponse = (error?: string): ApiResponse<Array<TimeSeriesPoint & { topReps: Array<{ name: string; revenue: number }> }>> => ({
    data: sampleData,
    source: "sample",
    error,
  });

  const parseNumber = (value: unknown): number => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatMonthLabel = (monthKey: string): string => {
    if (!monthKey || monthKey === "unknown") {
      return "Unknown";
    }
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(date.getTime())) {
      return monthKey;
    }
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const { data, error } = await supabase
      .from("all_time_sales")
      .select("date, month, sales_total, invoice_total, orders, order_quantity, vendor, rep")
      .gte("date", start.toISOString())
      .order("date", { ascending: true })
      .limit(6000);

    if (error) {
      console.warn("Supabase error fetching sales snapshots:", error);
      return getFallbackResponse(error.message);
    }

    if (!data || data.length === 0) {
      return getFallbackResponse();
    }

    type Bucket = {
      sortKey: string;
      label: string;
      revenue: number;
      orders: number;
      vendorRevenue: Map<string, number>;
      repRevenue: Map<string, number>;
    };

    const buckets = new Map<string, Bucket>();

    data.forEach((row) => {
      const monthKey = typeof row.month === "string" && /^\d{4}-\d{2}$/.test(row.month)
        ? row.month
        : row.date
          ? new Date(row.date).toISOString().slice(0, 7)
          : "unknown";

      if (!buckets.has(monthKey)) {
        buckets.set(monthKey, {
          sortKey: monthKey,
          label: formatMonthLabel(monthKey),
          revenue: 0,
          orders: 0,
          vendorRevenue: new Map<string, number>(),
          repRevenue: new Map<string, number>(),
        });
      }

      const bucket = buckets.get(monthKey)!;

      const revenue = parseNumber(row.invoice_total ?? row.sales_total);
      bucket.revenue += revenue;

      const orders = parseNumber(row.orders ?? row.order_quantity);
      bucket.orders += orders > 0 ? orders : 0;

      const vendorName = (row.vendor as string) || "Unknown";
      bucket.vendorRevenue.set(vendorName, (bucket.vendorRevenue.get(vendorName) ?? 0) + revenue);

      const repName = (row.rep as string) || "Unknown";
      bucket.repRevenue.set(repName, (bucket.repRevenue.get(repName) ?? 0) + revenue);
    });

    const snapshots = Array.from(buckets.values())
      .filter((bucket) => bucket.revenue > 0)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((bucket) => {
        const topVendors = Array.from(bucket.vendorRevenue.entries())
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        const topReps = Array.from(bucket.repRevenue.entries())
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        const orders = bucket.orders > 0 ? bucket.orders : 0;
        const avgOrderValue = orders > 0 ? bucket.revenue / orders : 0;

        return {
          date: bucket.label,
          value: bucket.revenue,
          secondary: bucket.revenue * 0.65,
          revenue: bucket.revenue,
          orders,
          avgOrderValue,
          topVendors,
          topReps,
        };
      });

    if (snapshots.length === 0) {
      return getFallbackResponse();
    }

    return {
      data: snapshots,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching sales snapshots:", error);
    return getFallbackResponse(error instanceof Error ? error.message : "Unknown error");
  }
}

// Blog Insights
export async function getBlogInsights(): Promise<
  ApiResponse<
    Array<{
      date: string;
      publishedAt: string;
      slug: string;
      title?: string;
      url?: string;
      views: number;
      engagement: number;
      sessions: number;
      backlinks: number;
      author?: string;
      category?: string;
      topKeyword?: string;
      suggestedTopic?: string;
    }>
  >
> {
  return {
    data: [
      {
        date: "Nov 1",
        publishedAt: "2024-11-01",
        slug: "getting-started-dashboard",
        title: "Getting Started with Dashboard",
        url: "https://blog.example.com/getting-started-dashboard",
        views: 1200,
        engagement: 240,
        sessions: 450,
        backlinks: 12,
        author: "John Smith",
        category: "Tutorial",
        topKeyword: "dashboard tutorial",
      },
      {
        date: "Nov 2",
        publishedAt: "2024-11-02",
        slug: "advanced-tips-tricks",
        title: "Advanced Tips and Tricks",
        url: "https://blog.example.com/advanced-tips-tricks",
        views: 1900,
        engagement: 380,
        sessions: 620,
        backlinks: 15,
        author: "Jane Doe",
        category: "Guide",
        topKeyword: "advanced features",
      },
      {
        date: "Nov 3",
        publishedAt: "2024-11-03",
        slug: "best-practices-guide",
        title: "Best Practices Guide",
        url: "https://blog.example.com/best-practices-guide",
        views: 1500,
        engagement: 300,
        sessions: 520,
        backlinks: 13,
        author: "Bob Wilson",
        category: "Best Practices",
        topKeyword: "best practices",
      },
    ],
  };
}

// Opportunity Keywords
export async function getOpportunityKeywords(): Promise<
  ApiResponse<
    {
      keyword: string;
      searchVolume: number;
      currentRank: number;
      targetRank: number;
      difficulty: number;
      suggestedAction: string;
    }[]
  >
> {
  return {
    data: [
      {
        keyword: "sustainable packaging solutions",
        searchVolume: 2400,
        currentRank: 18,
        targetRank: 3,
        difficulty: 45,
        suggestedAction: "Create pillar content with backlinks",
      },
      {
        keyword: "eco-friendly shipping supplies",
        searchVolume: 1890,
        currentRank: 12,
        targetRank: 2,
        difficulty: 52,
        suggestedAction: "Expand topic cluster, add case study",
      },
      {
        keyword: "green packaging materials",
        searchVolume: 3100,
        currentRank: 25,
        targetRank: 5,
        difficulty: 58,
        suggestedAction: "Outreach to industry partners",
      },
      {
        keyword: "carbon neutral delivery options",
        searchVolume: 890,
        currentRank: 8,
        targetRank: 1,
        difficulty: 35,
        suggestedAction: "Maintain rankings; update metrics",
      },
      {
        keyword: "sustainable business practices",
        searchVolume: 5600,
        currentRank: 42,
        targetRank: 10,
        difficulty: 68,
        suggestedAction: "Build backlink profile; internal linking",
      },
    ],
    source: "sample",
  };
}

// Ads Performance
export async function getAdsPerformance(): Promise<
  ApiResponse<
    {
      id: string;
      campaign: string;
      name: string;
      channel: string;
      spend: number;
      revenue: number;
      roi: number;
      roas: number;
      clicks: number;
      conversions: number;
      cpa: number;
    }[]
  > & { source: "sample"; refreshedAt: string }
> {
  return {
    data: [
      {
        id: "ads-1",
        campaign: "Google Search - Spring Sale",
        name: "Google Search - Spring Sale",
        channel: "google",
        spend: 15000,
        revenue: 52500,
        roi: 3.5,
        roas: 3.5,
        clicks: 4200,
        conversions: 420,
        cpa: 35.71,
      },
      {
        id: "ads-2",
        campaign: "Bing Shopping - Category A",
        name: "Bing Shopping - Category A",
        channel: "bing",
        spend: 8000,
        revenue: 22400,
        roi: 2.8,
        roas: 2.8,
        clicks: 1800,
        conversions: 180,
        cpa: 44.44,
      },
      {
        id: "ads-3",
        campaign: "Google Shopping - High Value",
        name: "Google Shopping - High Value",
        channel: "google",
        spend: 12000,
        revenue: 44400,
        roi: 3.7,
        roas: 3.7,
        clicks: 3200,
        conversions: 360,
        cpa: 33.33,
      },
      {
        id: "ads-4",
        campaign: "Bing Search - Brand",
        name: "Bing Search - Brand",
        channel: "bing",
        spend: 5000,
        revenue: 12500,
        roi: 2.5,
        roas: 2.5,
        clicks: 1100,
        conversions: 75,
        cpa: 66.67,
      },
    ],
    source: "sample",
    refreshedAt: new Date().toISOString(),
  };
}

// Ads Timeseries
export async function getAdsTimeseries(): Promise<
  ApiResponse<TimeSeriesPoint[]> & { refreshedAt: string }
> {
  return {
    data: [
      { date: "Nov 1", value: 5000 },
      { date: "Nov 2", value: 6200 },
      { date: "Nov 3", value: 5800 },
      { date: "Nov 4", value: 7100 },
      { date: "Nov 5", value: 6900 },
    ],
    refreshedAt: new Date().toISOString(),
  };
}

// Automation Projects
export async function getAutomationProjects(): Promise<
  ApiResponse<
    Array<{
      id: string;
      name: string;
      title: string;
      status: string;
      progress: number;
      stage: "Backlog" | "In Progress" | "QA" | "Launched";
      priority: "High" | "Medium" | "Low";
      owner: string;
      nextReview: string;
      tags: string[];
      estimatedImpact: string;
    }>
  >
> {
  return {
    data: [
      {
        id: "1",
        name: "Auto Email Responder",
        title: "Auto Email Responder",
        status: "active",
        progress: 75,
        stage: "In Progress",
        priority: "High",
        owner: "Sarah Chen",
        nextReview: "2024-11-15",
        tags: ["email", "automation", "customer"],
        estimatedImpact: "5,000 hrs/year",
      },
      {
        id: "2",
        name: "Inventory Sync v2",
        title: "Inventory Sync v2",
        status: "active",
        progress: 90,
        stage: "QA",
        priority: "High",
        owner: "Mike Johnson",
        nextReview: "2024-11-12",
        tags: ["sync", "inventory", "backend"],
        estimatedImpact: "$50K/year",
      },
      {
        id: "3",
        name: "Customer Feedback Loop",
        title: "Customer Feedback Loop",
        status: "completed",
        progress: 100,
        stage: "Launched",
        priority: "Medium",
        owner: "Emma Rodriguez",
        nextReview: "2024-11-20",
        tags: ["feedback", "analytics"],
        estimatedImpact: "3,000 hrs/year",
      },
      {
        id: "4",
        name: "Report Generation",
        title: "Report Generation",
        status: "planning",
        progress: 25,
        stage: "Backlog",
        priority: "Medium",
        owner: "James Wilson",
        nextReview: "2024-11-18",
        tags: ["reporting", "data"],
        estimatedImpact: "2,000 hrs/year",
      },
    ],
    source: "sample",
  };
}

// Automations
export async function getAutomations(): Promise<
  ApiResponse<
    Array<{
      id: string;
      name: string;
      enabled: boolean;
      lastRunAt: string;
      status: "running" | "paused" | "error" | "draft";
      owner: string;
      timeSavedHours?: number;
      dollarsAdded?: number;
      dollarsSaved?: number;
    }>
  >
> {
  return {
    data: [
      {
        id: "1",
        name: "Auto Inventory Sync",
        enabled: true,
        lastRunAt: "2024-11-10T10:30:00",
        status: "running",
        owner: "ops-team",
        timeSavedHours: 12,
        dollarsAdded: 2400,
        dollarsSaved: 1800,
      },
      {
        id: "2",
        name: "Daily Report Generator",
        enabled: true,
        lastRunAt: "2024-11-10T09:15:00",
        status: "running",
        owner: "analytics",
        timeSavedHours: 8,
        dollarsAdded: 1200,
        dollarsSaved: 900,
      },
      {
        id: "3",
        name: "Customer Notification Flow",
        enabled: false,
        lastRunAt: "2024-11-09T15:30:00",
        status: "paused",
        owner: "marketing",
        timeSavedHours: 5,
        dollarsAdded: 0,
        dollarsSaved: 0,
      },
    ],
    source: "sample",
  };
}

// Lifecycle Performance (Email campaigns and SMS journeys)
export async function getLifecyclePerformance(
  channel?: string,
): Promise<
  ApiResponse<
    {
      id: string;
      name: string;
      type: string;
      status: "active" | "paused" | "draft";
      sendCount: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      revenue: number;
      lastRunAt?: string;
    }[]
  >
> {
  // Email campaigns
  const emailData = [
    {
      id: "email-1",
      name: "Welcome Series",
      type: "journey",
      status: "active" as const,
      sendCount: 12500,
      openRate: 0.42,
      clickRate: 0.28,
      conversionRate: 0.04,
      revenue: 45000,
      lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "email-2",
      name: "Post-Purchase Follow-up",
      type: "journey",
      status: "active" as const,
      sendCount: 8900,
      openRate: 0.48,
      clickRate: 0.35,
      conversionRate: 0.12,
      revenue: 67500,
      lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "email-3",
      name: "Win-back Campaign",
      type: "blast",
      status: "paused" as const,
      sendCount: 3200,
      openRate: 0.28,
      clickRate: 0.18,
      conversionRate: 0.02,
      revenue: 8900,
      lastRunAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  // SMS journeys
  const smsData = [
    {
      id: "sms-1",
      name: "Order Status Notifications",
      type: "journey",
      status: "active" as const,
      sendCount: 5400,
      openRate: 0.52,
      clickRate: 0.32,
      conversionRate: 0.05,
      revenue: 18000,
      lastRunAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "sms-2",
      name: "Restock Nurture",
      type: "journey",
      status: "active" as const,
      sendCount: 2100,
      openRate: 0.58,
      clickRate: 0.38,
      conversionRate: 0.08,
      revenue: 22500,
      lastRunAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: "sms-3",
      name: "Flash Sale Promotion",
      type: "blast",
      status: "draft" as const,
      sendCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0,
      lastRunAt: undefined,
    },
  ];

  return {
    data: channel === "sms" ? smsData : emailData,
  };
}

// Review Blueprints
export async function getReviewBlueprints(): Promise<ApiResponse<ReviewsBlueprint[]>> {
  return {
    data: [
      {
        id: "1",
        productId: "sku-001",
        name: "Blueprint A",
        description: "Sample blueprint",
        prompts: ["prompt1", "prompt2"],
        targetPersona: "IT Manager",
        productName: "Solution X",
        keyBenefits: ["reliability", "performance", "ease of use"],
        tone: "professional",
      },
    ],
  };
}

// SKU Ad Spend - Monthly Summary
export async function getSkuAdSpendMonthlySummary(): Promise<
  ApiResponse<
    Array<{
      month: string;
      totalAdSpend: number;
      totalRevenue: number;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const { data, error } = await supabase
      .from("sku_ad_spend")
      .select("month, ad_spend, revenue, impressions, clicks, conversions");

    if (error) {
      console.warn("Supabase error fetching monthly summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            month: "2024-11",
            totalAdSpend: 25000,
            totalRevenue: 125000,
            totalImpressions: 500000,
            totalClicks: 12500,
            totalConversions: 850,
          },
          {
            month: "2024-10",
            totalAdSpend: 22000,
            totalRevenue: 110000,
            totalImpressions: 480000,
            totalClicks: 11200,
            totalConversions: 780,
          },
          {
            month: "2024-09",
            totalAdSpend: 20000,
            totalRevenue: 95000,
            totalImpressions: 420000,
            totalClicks: 10080,
            totalConversions: 650,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    // Aggregate by month
    const aggregated = new Map<string, any>();
    data?.forEach(row => {
      const month = row.month;
      if (!aggregated.has(month)) {
        aggregated.set(month, {
          month,
          totalAdSpend: 0,
          totalRevenue: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
        });
      }
      const agg = aggregated.get(month)!;
      agg.totalAdSpend += row.ad_spend || 0;
      agg.totalRevenue += row.revenue || 0;
      agg.totalImpressions += row.impressions || 0;
      agg.totalClicks += row.clicks || 0;
      agg.totalConversions += row.conversions || 0;
    });

    const result = Array.from(aggregated.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching SKU ad spend monthly summary:", error);
    return {
      data: [],
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
}

// SKU Ad Spend - Vendor Summary
export async function getSkuAdSpendVendorSummary(): Promise<
  ApiResponse<
    Array<{
      vendor: string;
      totalAdSpend: number;
      totalRevenue: number;
      avgCpc?: number;
      avgCtrPercent?: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const { data, error } = await supabase
      .from("sku_ad_spend")
      .select("platform, ad_spend, revenue, clicks, impressions");

    if (error) {
      console.warn("Supabase error fetching vendor summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            vendor: "Amazon",
            totalAdSpend: 12000,
            totalRevenue: 60000,
            avgCpc: 0.96,
            avgCtrPercent: 2.5,
          },
          {
            vendor: "Google Ads",
            totalAdSpend: 8000,
            totalRevenue: 48000,
            avgCpc: 0.64,
            avgCtrPercent: 1.8,
          },
          {
            vendor: "Walmart",
            totalAdSpend: 5000,
            totalRevenue: 17000,
            avgCpc: 0.4,
            avgCtrPercent: 1.2,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    // Aggregate by platform
    const aggregated = new Map<string, any>();
    data?.forEach(row => {
      const vendor = row.platform;
      if (!aggregated.has(vendor)) {
        aggregated.set(vendor, {
          vendor,
          totalAdSpend: 0,
          totalRevenue: 0,
          totalClicks: 0,
          totalImpressions: 0,
        });
      }
      const agg = aggregated.get(vendor)!;
      agg.totalAdSpend += row.ad_spend || 0;
      agg.totalRevenue += row.revenue || 0;
      agg.totalClicks += row.clicks || 0;
      agg.totalImpressions += row.impressions || 0;
    });

    const result = Array.from(aggregated.values())
      .map(item => ({
        ...item,
        avgCpc: item.totalAdSpend > 0 && item.totalClicks > 0
          ? item.totalAdSpend / item.totalClicks
          : 0,
        avgCtrPercent: item.totalImpressions > 0 && item.totalClicks > 0
          ? (item.totalClicks / item.totalImpressions) * 100
          : 0,
      }))
      .sort((a, b) => b.totalAdSpend - a.totalAdSpend);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching SKU ad spend vendor summary:", error);
    return {
      data: [],
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
}

// SKU Ad Spend - Category Summary
export async function getSkuAdSpendCategorySummary(): Promise<
  ApiResponse<
    Array<{
      productCategory: string;
      totalAdSpend: number;
      totalRevenue: number;
      totalConversions: number;
      avgAdSpendPerRecord: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const { data, error } = await supabase
      .from("sku_ad_spend")
      .select("*")
      .limit(1000);

    if (error) {
      console.warn("Supabase error fetching category summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            productCategory: "Electronics",
            totalAdSpend: 10000,
            totalRevenue: 50000,
            totalConversions: 340,
            avgAdSpendPerRecord: 29.41,
          },
          {
            productCategory: "Home & Garden",
            totalAdSpend: 8000,
            totalRevenue: 40000,
            totalConversions: 290,
            avgAdSpendPerRecord: 27.59,
          },
          {
            productCategory: "Sports & Outdoors",
            totalAdSpend: 7000,
            totalRevenue: 35000,
            totalConversions: 220,
            avgAdSpendPerRecord: 31.82,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    // Aggregate by category (try different possible column names)
    const aggregated = new Map<string, any>();
    data?.forEach(row => {
      // Try to find category column (different naming conventions)
      const categoryValue =
        row.product_category ||
        row.productCategory ||
        row.category ||
        row.prod_category ||
        "Uncategorized";

      if (!aggregated.has(categoryValue)) {
        aggregated.set(categoryValue, {
          productCategory: categoryValue,
          totalAdSpend: 0,
          totalRevenue: 0,
          totalConversions: 0,
          recordCount: 0,
        });
      }
      const agg = aggregated.get(categoryValue)!;
      agg.totalAdSpend += row.ad_spend || 0;
      agg.totalRevenue += row.revenue || 0;
      agg.totalConversions += row.conversions || 0;
      agg.recordCount += 1;
    });

    const result = Array.from(aggregated.values())
      .map(item => ({
        ...item,
        avgAdSpendPerRecord: item.recordCount > 0
          ? item.totalAdSpend / item.recordCount
          : 0,
      }))
      .sort((a, b) => b.totalAdSpend - a.totalAdSpend);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching SKU ad spend category summary:", error);
    return {
      data: [],
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
}

// Top Products from all_time_sales
export async function getTopProducts(
  limit: number = 20,
  dateRange?: { start: string; end: string }
): Promise<
  ApiResponse<
    Array<{
      sku: string;
      description: string;
      vendor: string;
      product_category: string;
      overall_product_category: string;
      total_sales: number;
      total_revenue: number;
      total_profit: number;
      total_orders: number;
      avg_roi: number;
      avg_price: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    let query = supabase
      .from("all_time_sales")
      .select("sku, description, vendor, product_category, overall_product_category, sales_total, profit_total, orders, roi, sales_each");

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      console.warn("Supabase error fetching top products:", error);
      // Fallback to sample data
      return {
        data: [
          {
            sku: "SDPL-8000-DT",
            description: "Parking Lift Drip Trays for SDPL-8000 (3 Pack)",
            vendor: "Titan Lifts",
            product_category: "Automotive Equipment",
            overall_product_category: "Equipment",
            total_sales: 15000,
            total_revenue: 85000,
            total_profit: 25500,
            total_orders: 120,
            avg_roi: 0.3,
            avg_price: 125
          },
          {
            sku: "RS80JB02",
            description: "8\" x 2\" Mold-On Rubber Cast Wheel - 600 lbs Capacity",
            vendor: "Durable Superior Casters",
            product_category: "General Casters",
            overall_product_category: "Casters",
            total_sales: 12500,
            total_revenue: 67500,
            total_profit: 22500,
            total_orders: 465,
            avg_roi: 0.33,
            avg_price: 26.83
          },
          {
            sku: "GR-6",
            description: "Heavy Duty Warehouse Guard Rail Beam Length 6 ft",
            vendor: "Handle-It",
            product_category: "Guard Rail",
            overall_product_category: "Warehouse Protection",
            total_sales: 8900,
            total_revenue: 52300,
            total_profit: 18900,
            total_orders: 63,
            avg_roi: 0.36,
            avg_price: 141.7
          },
          {
            sku: "509937010009",
            description: "PTE33Q Battery for Powered Pallet Jack",
            vendor: "Noblelift",
            product_category: "Battery, Charger, Accessories",
            overall_product_category: "Accessories",
            total_sales: 7500,
            total_revenue: 45000,
            total_profit: 15750,
            total_orders: 15,
            avg_roi: 0.35,
            avg_price: 500
          },
          {
            sku: "BCSV404036",
            description: "4\" Carbon Steel Dome Top Bollard with Baseplate",
            vendor: "S4 Bollards",
            product_category: "Fixed Bollards",
            overall_product_category: "Bollards",
            total_sales: 6400,
            total_revenue: 38400,
            total_profit: 13440,
            total_orders: 32,
            avg_roi: 0.35,
            avg_price: 199.25
          }
        ],
        source: "sample",
        error: error?.message,
        refreshedAt: new Date().toISOString()
      };
    }

    // Aggregate data by SKU
    const aggregated = new Map<string, any>();

    data.forEach(row => {
      const key = row.sku;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          sku: row.sku,
          description: row.description,
          vendor: row.vendor,
          product_category: row.product_category || "Uncategorized",
          overall_product_category: row.overall_product_category || "Other",
          total_sales: 0,
          total_revenue: 0,
          total_profit: 0,
          total_orders: 0,
          roi_sum: 0,
          roi_count: 0,
          price_sum: 0,
          price_count: 0
        });
      }

      const agg = aggregated.get(key)!;
      agg.total_sales += row.sales_total || 0;
      agg.total_revenue += row.sales_total || 0;
      agg.total_profit += row.profit_total || 0;
      agg.total_orders += row.orders || 0;

      if (row.roi) {
        agg.roi_sum += row.roi;
        agg.roi_count += 1;
      }

      if (row.sales_each) {
        agg.price_sum += row.sales_each;
        agg.price_count += 1;
      }
    });

    // Calculate averages and sort by revenue
    const result = Array.from(aggregated.values())
      .map(item => ({
        sku: item.sku,
        description: item.description,
        vendor: item.vendor,
        product_category: item.product_category,
        overall_product_category: item.overall_product_category,
        total_sales: item.total_sales,
        total_revenue: item.total_revenue,
        total_profit: item.total_profit,
        total_orders: item.total_orders,
        avg_roi: item.roi_count > 0 ? item.roi_sum / item.roi_count : 0,
        avg_price: item.price_count > 0 ? item.price_sum / item.price_count : 0
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return {
      data: [],
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString()
    };
  }
}

// SKU Ad Spend - Top SKUs
export async function getSkuAdSpendTopSkus(
  limit: number = 20,
  month?: string,
): Promise<
  ApiResponse<
    Array<{
      month: string;
      sku: string;
      title: string;
      platform: string;
      adSpend: number;
      revenue: number;
      impressions: number;
      clicks: number;
      ctr?: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    let query = supabase
      .from("sku_ad_spend")
      .select("month, sku, title, platform, ad_spend, revenue, impressions, clicks")
      .order("ad_spend", { ascending: false })
      .limit(limit);

    if (month) {
      query = query.eq("month", month);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching top SKUs:", error);
      // Fallback to sample data
      const sampleData = [
        {
          month: month || "2024-11",
          sku: "SKU-001",
          title: "Premium Wireless Headphones",
          platform: "Amazon",
          adSpend: 2500,
          revenue: 15000,
          impressions: 125000,
          clicks: 3125,
          ctr: 0.025,
        },
        {
          month: month || "2024-11",
          sku: "SKU-002",
          title: "Smart Home Security System",
          platform: "Google Ads",
          adSpend: 1800,
          revenue: 12000,
          impressions: 90000,
          clicks: 1620,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-003",
          title: "Ergonomic Office Chair",
          platform: "Amazon",
          adSpend: 1600,
          revenue: 11000,
          impressions: 80000,
          clicks: 1440,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-004",
          title: "Portable Power Bank",
          platform: "Walmart",
          adSpend: 1200,
          revenue: 9000,
          impressions: 60000,
          clicks: 1080,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-005",
          title: "Stainless Steel Water Bottle",
          platform: "Amazon",
          adSpend: 900,
          revenue: 6500,
          impressions: 45000,
          clicks: 810,
          ctr: 0.018,
        },
      ];

      return {
        data: sampleData.slice(0, limit),
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    // Calculate CTR for each row
    const result = (data || []).map(row => ({
      month: row.month,
      sku: row.sku,
      title: row.title,
      platform: row.platform,
      adSpend: row.ad_spend,
      revenue: row.revenue,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.impressions > 0 ? row.clicks / row.impressions : 0,
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching SKU ad spend top SKUs:", error);
    return {
      data: [],
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
}
