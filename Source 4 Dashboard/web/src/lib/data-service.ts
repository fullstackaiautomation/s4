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
import { getSupabaseServerClient } from "./supabase/server";

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
  profitTotal: number;
};

// Operational Alerts
export async function getOperationalAlerts(): Promise<ApiResponse<OperationalAlert[]>> {
  return { data: SAMPLE_ALERTS };
}

const SAMPLE_SALES_RECORDS: SalesRecord[] = [
  {
    id: "sample-1",
    date: new Date().toISOString(),
    vendor: "Sample Vendor",
    rep: "Sample Rep",
    invoiceTotal: 45000,
    salesTotal: 45000,
    orders: 24,
    orderQuantity: 24,
  },
];

const SALES_DATA_START_DATE = "2022-11-01";
const SALES_DATA_START_MONTH = "2022-11";
const SALES_DATA_START = new Date(`${SALES_DATA_START_DATE}T00:00:00Z`);

export async function getSalesRecords(limit?: number): Promise<ApiResponse<SalesRecord[]>> {
  try {
    const supabase = await getSupabaseServerClient();
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    const allRows: any[] = [];
    const maxRows = limit ?? Number.MAX_SAFE_INTEGER;

    while (hasMore && allRows.length < maxRows) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("all_time_sales")
        .select("id, date, vendor, rep, invoice_total, sales_total, orders, order_quantity, profit_total")
        .gte("date", SALES_DATA_START_DATE)
        .order("date", { ascending: true })
        .range(from, to);

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
        break;
      }

      allRows.push(...data);
      hasMore = data.length === pageSize && allRows.length < maxRows;
      from += pageSize;
    }

    if (!allRows.length) {
      return {
        data: SAMPLE_SALES_RECORDS,
        source: "sample",
        warning: "No sales records returned from Supabase",
        refreshedAt: new Date().toISOString(),
      };
    }

    const rows = limit ? allRows.slice(-limit) : allRows;

    const records: SalesRecord[] = rows
      .map((row, index) => {
        const rawDate = row.date as string | null;
        const parsedDate = rawDate ? new Date(rawDate) : null;
        const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());

        // Log first few dates to debug
        if (index < 5) {
          console.log(`[getSalesRecords] Row ${index}: rawDate="${rawDate}", parsedDate="${parsedDate?.toISOString()}", isValid=${isValidDate}`);
        }

        return {
          id: (row.id as string) ?? `record-${index}`,
          date: isValidDate ? parsedDate.toISOString() : '',
          vendor: (row.vendor as string) || "Unknown Vendor",
          rep: (row.rep as string) || "Unknown Rep",
          invoiceTotal: Number(row.invoice_total ?? row.sales_total ?? 0) || 0,
          salesTotal: Number(row.sales_total ?? row.invoice_total ?? 0) || 0,
          orders: Number(row.orders ?? 0) || 0,
          orderQuantity: Number(row.order_quantity ?? row.orders ?? 0) || 0,
          profitTotal: Number(row.profit_total ?? 0) || 0,
        };
      })
      .filter((record) => {
        if (record.date === '') return false;
        const parsedDate = new Date(record.date);
        return !Number.isNaN(parsedDate.getTime()) && parsedDate >= SALES_DATA_START;
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
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("all_quotes")
      .select("task_id, quote_number, vendor, rep, amount, quote_status, created_at, inquiry_date, turned_to_order")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase error fetching quotes:", error);
      return {
        data: SAMPLE_QUOTES,
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    if (!data || data.length === 0) {
      return {
        data: SAMPLE_QUOTES,
        source: "sample",
        warning: "No quotes returned from Supabase",
        refreshedAt: new Date().toISOString(),
      };
    }

    // Map database records to Quote type
    const quotes: Quote[] = data.map((row, index) => {
      const createdAtDate = row.created_at ? new Date(row.created_at) : null;
      const inquiryDateParsed = row.inquiry_date ? new Date(row.inquiry_date) : null;

      // Determine status based on available fields
      let status: "open" | "won" | "lost" = "open";
      const statusField = (row.quote_status as string)?.toLowerCase() || "";

      if (row.turned_to_order || statusField.includes("won") || statusField.includes("order")) {
        status = "won";
      } else if (statusField.includes("lost") || statusField.includes("dead") || statusField.includes("cancelled")) {
        status = "lost";
      }

      // Parse close date safely
      let closeDate: string | undefined;
      if (row.turned_to_order) {
        try {
          const closeDateParsed = new Date(row.turned_to_order);
          if (!Number.isNaN(closeDateParsed.getTime())) {
            closeDate = closeDateParsed.toISOString();
          }
        } catch {
          // Invalid date, leave undefined
        }
      }

      return {
        id: row.quote_number || row.task_id || `quote-${index}`,
        vendor: (row.vendor as string) || "Unknown Vendor",
        rep: (row.rep as string) || "Unknown Rep",
        amount: Number(row.amount ?? 0) || 0,
        value: Number(row.amount ?? 0) || 0,
        date: inquiryDateParsed && !Number.isNaN(inquiryDateParsed.getTime())
          ? inquiryDateParsed.toISOString()
          : new Date().toISOString(),
        createdAt: createdAtDate && !Number.isNaN(createdAtDate.getTime())
          ? createdAtDate.toISOString()
          : new Date().toISOString(),
        closeDate,
        status,
      };
    });

    return {
      data: quotes,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return {
      data: SAMPLE_QUOTES,
      source: "sample",
      error: error instanceof Error ? error.message : "Unknown error",
      refreshedAt: new Date().toISOString(),
    };
  }
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
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("all_time_sales")
      .select("invoice_number, vendor, rep, invoice_total, sales_total, date, description")
      .gte("date", SALES_DATA_START_DATE)
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
          if (Number.isNaN(parsed.getTime()) || parsed < SALES_DATA_START) {
            return null;
          }
          return parsed.toISOString();
        })();

        if (!isoDate) {
          return;
        }

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
      .filter((item) => item.value >= 10000)
      .sort((a, b) => b.value - a.value)
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
    const supabase = await getSupabaseServerClient();

    // Supabase enforces a server-side max of 1000 rows per query
    // We need to fetch ALL rows using pagination
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("all_time_sales")
        .select("date, month, sales_total, invoice_total, orders, order_quantity, vendor, rep")
        .gte("date", SALES_DATA_START_DATE)
        .order("date", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn("Supabase error fetching sales snapshots:", error);
        return getFallbackResponse(error.message);
      }

      if (!data || data.length === 0) {
        break;
      }

      allData = allData.concat(data);
      hasMore = data.length === pageSize;
      from += pageSize;
    }

    if (allData.length === 0) {
      return getFallbackResponse();
    }

    console.log(`[getSalesSnapshots] ✅ Fetched ${allData.length} rows from Supabase using pagination`);

    type Bucket = {
      sortKey: string;
      label: string;
      revenue: number;
      orders: number;
      vendorRevenue: Map<string, number>;
      repRevenue: Map<string, number>;
    };

    const buckets = new Map<string, Bucket>();

    allData.forEach((row) => {
      const monthKey = typeof row.month === "string" && /^\d{4}-\d{2}$/.test(row.month)
        ? row.month
        : row.date
          ? new Date(row.date).toISOString().slice(0, 7)
          : "unknown";

      if (!monthKey || monthKey === "unknown" || monthKey < SALES_DATA_START_MONTH) {
        return;
      }

      const rowDate = row.date ? new Date(row.date) : null;
      if (rowDate && Number.isNaN(rowDate.getTime())) {
        return;
      }

      if (rowDate && rowDate < SALES_DATA_START) {
        return;
      }

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

    console.log(`[getSalesSnapshots] ✅ Aggregated into ${snapshots.length} months: ${snapshots[0]?.date} → ${snapshots[snapshots.length - 1]?.date}`);

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
      totalSalesRevenue: number;
      totalSalesProfit: number;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      totalOrders: number;
      totalOrderQuantity: number;
      totalAttributedRevenue: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("sku_sales_ad_spend_monthly_summary")
      .select(
        "month, total_ad_spend, total_sales_revenue, total_sales_profit, total_impressions, total_clicks, total_conversions, total_orders, total_order_quantity, total_attributed_revenue",
      )
      .order("month", { ascending: false });

    if (error) {
      console.warn("Supabase error fetching monthly summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            month: "2024-11",
            totalAdSpend: 25000,
            totalSalesRevenue: 118500,
            totalSalesProfit: 42800,
            totalImpressions: 500000,
            totalClicks: 12500,
            totalConversions: 850,
            totalOrders: 640,
            totalOrderQuantity: 948,
            totalAttributedRevenue: 40500,
          },
          {
            month: "2024-10",
            totalAdSpend: 22000,
            totalSalesRevenue: 101200,
            totalSalesProfit: 37200,
            totalImpressions: 480000,
            totalClicks: 11200,
            totalConversions: 780,
            totalOrders: 610,
            totalOrderQuantity: 903,
            totalAttributedRevenue: 36100,
          },
          {
            month: "2024-09",
            totalAdSpend: 20000,
            totalSalesRevenue: 89000,
            totalSalesProfit: 33100,
            totalImpressions: 420000,
            totalClicks: 10080,
            totalConversions: 650,
            totalOrders: 575,
            totalOrderQuantity: 812,
            totalAttributedRevenue: 29850,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    const result = (data ?? []).map((row) => ({
      month: row.month,
      totalAdSpend: Number(row.total_ad_spend ?? 0),
      totalSalesRevenue: Number(row.total_sales_revenue ?? 0),
      totalSalesProfit: Number(row.total_sales_profit ?? 0),
      totalImpressions: Number(row.total_impressions ?? 0),
      totalClicks: Number(row.total_clicks ?? 0),
      totalConversions: Number(row.total_conversions ?? 0),
      totalOrders: Number(row.total_orders ?? 0),
      totalOrderQuantity: Number(row.total_order_quantity ?? 0),
      totalAttributedRevenue: Number(row.total_attributed_revenue ?? 0),
    }));

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
      totalSalesRevenue: number;
      totalSalesProfit: number;
      avgCpc?: number;
      avgCtrPercent?: number;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      totalOrders: number;
      totalOrderQuantity: number;
      totalAttributedRevenue: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("sku_sales_ad_spend_vendor_summary")
      .select(
        "vendor, total_ad_spend, total_sales_revenue, total_sales_profit, total_impressions, total_clicks, total_conversions, total_orders, total_order_quantity, total_attributed_revenue, avg_cpc, avg_ctr_percent",
      )
      .order("total_ad_spend", { ascending: false });

    if (error) {
      console.warn("Supabase error fetching vendor summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            vendor: "Amazon",
            totalAdSpend: 12000,
            totalSalesRevenue: 54000,
            totalSalesProfit: 19800,
            avgCpc: 0.96,
            avgCtrPercent: 2.5,
            totalImpressions: 180000,
            totalClicks: 12500,
            totalConversions: 320,
            totalOrders: 210,
            totalOrderQuantity: 315,
            totalAttributedRevenue: 18250,
          },
          {
            vendor: "Google Ads",
            totalAdSpend: 8000,
            totalSalesRevenue: 42200,
            totalSalesProfit: 15400,
            avgCpc: 0.64,
            avgCtrPercent: 1.8,
            totalImpressions: 120000,
            totalClicks: 9000,
            totalConversions: 240,
            totalOrders: 185,
            totalOrderQuantity: 268,
            totalAttributedRevenue: 15000,
          },
          {
            vendor: "Walmart",
            totalAdSpend: 5000,
            totalSalesRevenue: 15600,
            totalSalesProfit: 5200,
            avgCpc: 0.4,
            avgCtrPercent: 1.2,
            totalImpressions: 78000,
            totalClicks: 5600,
            totalConversions: 140,
            totalOrders: 96,
            totalOrderQuantity: 143,
            totalAttributedRevenue: 6200,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    const result = (data ?? []).map((row) => ({
      vendor: row.vendor,
      totalAdSpend: Number(row.total_ad_spend ?? 0),
      totalSalesRevenue: Number(row.total_sales_revenue ?? 0),
      totalSalesProfit: Number(row.total_sales_profit ?? 0),
      avgCpc: row.avg_cpc != null ? Number(row.avg_cpc) : undefined,
      avgCtrPercent: row.avg_ctr_percent != null ? Number(row.avg_ctr_percent) : undefined,
      totalImpressions: Number(row.total_impressions ?? 0),
      totalClicks: Number(row.total_clicks ?? 0),
      totalConversions: Number(row.total_conversions ?? 0),
      totalOrders: Number(row.total_orders ?? 0),
      totalOrderQuantity: Number(row.total_order_quantity ?? 0),
      totalAttributedRevenue: Number(row.total_attributed_revenue ?? 0),
    }));

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
      totalSalesRevenue: number;
      totalSalesProfit: number;
      totalConversions: number;
      avgAdSpendPerRecord: number;
      totalImpressions: number;
      totalClicks: number;
      totalOrders: number;
      totalOrderQuantity: number;
      totalAttributedRevenue: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("sku_sales_ad_spend_category_summary")
      .select(
        "product_category, total_ad_spend, total_sales_revenue, total_sales_profit, total_conversions, avg_ad_spend_per_record, total_impressions, total_clicks, total_orders, total_order_quantity, total_attributed_revenue",
      )
      .order("total_ad_spend", { ascending: false });

    if (error) {
      console.warn("Supabase error fetching category summary:", error);
      // Fallback to sample data
      return {
        data: [
          {
            productCategory: "Electronics",
            totalAdSpend: 10000,
            totalSalesRevenue: 45500,
            totalSalesProfit: 16250,
            totalConversions: 340,
            avgAdSpendPerRecord: 29.41,
            totalImpressions: 95000,
            totalClicks: 3400,
            totalOrders: 230,
            totalOrderQuantity: 352,
            totalAttributedRevenue: 14500,
          },
          {
            productCategory: "Home & Garden",
            totalAdSpend: 8000,
            totalSalesRevenue: 36500,
            totalSalesProfit: 12800,
            totalConversions: 290,
            avgAdSpendPerRecord: 27.59,
            totalImpressions: 81000,
            totalClicks: 2800,
            totalOrders: 205,
            totalOrderQuantity: 300,
            totalAttributedRevenue: 11800,
          },
          {
            productCategory: "Sports & Outdoors",
            totalAdSpend: 7000,
            totalSalesRevenue: 32500,
            totalSalesProfit: 11200,
            totalConversions: 220,
            avgAdSpendPerRecord: 31.82,
            totalImpressions: 69000,
            totalClicks: 2450,
            totalOrders: 180,
            totalOrderQuantity: 270,
            totalAttributedRevenue: 9900,
          },
        ],
        source: "sample",
        error: error.message,
        refreshedAt: new Date().toISOString(),
      };
    }

    const result = (data ?? []).map((row) => ({
      productCategory: row.product_category,
      totalAdSpend: Number(row.total_ad_spend ?? 0),
      totalSalesRevenue: Number(row.total_sales_revenue ?? 0),
      totalSalesProfit: Number(row.total_sales_profit ?? 0),
      totalConversions: Number(row.total_conversions ?? 0),
      avgAdSpendPerRecord: Number(row.avg_ad_spend_per_record ?? 0),
      totalImpressions: Number(row.total_impressions ?? 0),
      totalClicks: Number(row.total_clicks ?? 0),
      totalOrders: Number(row.total_orders ?? 0),
      totalOrderQuantity: Number(row.total_order_quantity ?? 0),
      totalAttributedRevenue: Number(row.total_attributed_revenue ?? 0),
    }));

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
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("all_time_sales")
      .select("sku, description, vendor, product_category, overall_product_category, sales_total, profit_total, orders, roi, sales_each, date")
      .gte("date", SALES_DATA_START_DATE);

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
      if (row.date) {
        const parsedDate = new Date(row.date);
        if (!Number.isNaN(parsedDate.getTime()) && parsedDate < SALES_DATA_START) {
          return;
        }
      }

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
      vendor: string;
      productCategory?: string;
      overallProductCategory?: string;
      adSpend: number;
      salesRevenue: number;
      salesProfit: number;
      impressions: number;
      clicks: number;
      conversions: number;
      attributedRevenue: number;
      orders: number;
      orderQuantity: number;
      ctr?: number;
    }>
  > & { source: "supabase" | "sample"; refreshedAt: string }
> {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("sku_sales_ad_spend_by_sku_month")
      .select(
        "month, sku, title, vendor, product_category, overall_product_category, total_ad_spend, total_sales_revenue, total_sales_profit, total_impressions, total_clicks, total_conversions, total_attributed_revenue, total_orders, total_order_quantity",
      )
      .order("total_ad_spend", { ascending: false })
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
          vendor: "Acme Audio",
          productCategory: "Electronics",
          adSpend: 2500,
          salesRevenue: 14800,
          salesProfit: 5200,
          impressions: 125000,
          clicks: 3125,
          conversions: 96,
          attributedRevenue: 6100,
          orders: 72,
          orderQuantity: 108,
          ctr: 0.025,
        },
        {
          month: month || "2024-11",
          sku: "SKU-002",
          title: "Smart Home Security System",
          vendor: "SecureCo",
          productCategory: "Home & Garden",
          adSpend: 1800,
          salesRevenue: 11800,
          salesProfit: 4300,
          impressions: 90000,
          clicks: 1620,
          conversions: 64,
          attributedRevenue: 4800,
          orders: 58,
          orderQuantity: 87,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-003",
          title: "Ergonomic Office Chair",
          vendor: "ComfortWorks",
          productCategory: "Office",
          adSpend: 1600,
          salesRevenue: 10250,
          salesProfit: 3550,
          impressions: 80000,
          clicks: 1440,
          conversions: 51,
          attributedRevenue: 4200,
          orders: 46,
          orderQuantity: 69,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-004",
          title: "Portable Power Bank",
          vendor: "VoltX",
          productCategory: "Electronics",
          adSpend: 1200,
          salesRevenue: 8700,
          salesProfit: 2900,
          impressions: 60000,
          clicks: 1080,
          conversions: 42,
          attributedRevenue: 3600,
          orders: 39,
          orderQuantity: 58,
          ctr: 0.018,
        },
        {
          month: month || "2024-11",
          sku: "SKU-005",
          title: "Stainless Steel Water Bottle",
          vendor: "Hydrate+",
          productCategory: "Sports & Outdoors",
          adSpend: 900,
          salesRevenue: 6100,
          salesProfit: 2050,
          impressions: 45000,
          clicks: 810,
          conversions: 28,
          attributedRevenue: 2500,
          orders: 25,
          orderQuantity: 38,
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

    const result = (data || []).map((row) => ({
      month: row.month,
      sku: row.sku,
      title: row.title ?? "Unknown Title",
      vendor: row.vendor ?? "Unknown Vendor",
      productCategory: row.product_category ?? undefined,
      overallProductCategory: row.overall_product_category ?? undefined,
      adSpend: Number(row.total_ad_spend ?? 0),
      salesRevenue: Number(row.total_sales_revenue ?? 0),
      salesProfit: Number(row.total_sales_profit ?? 0),
      impressions: Number(row.total_impressions ?? 0),
      clicks: Number(row.total_clicks ?? 0),
      conversions: Number(row.total_conversions ?? 0),
      attributedRevenue: Number(row.total_attributed_revenue ?? 0),
      orders: Number(row.total_orders ?? 0),
      orderQuantity: Number(row.total_order_quantity ?? 0),
      ctr: Number(row.total_impressions ?? 0) > 0 ? Number(row.total_clicks ?? 0) / Number(row.total_impressions ?? 0) : 0,
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
