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
    profitTotal: 0,
  },
];

const SALES_DATA_START_DATE = "2022-11-01";
const SALES_DATA_START_MONTH = "2022-11";
const SALES_DATA_START_ISO = `${SALES_DATA_START_DATE}T00:00:00.000Z`;
const SALES_DATA_START = new Date(SALES_DATA_START_ISO);

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_WITH_OPTIONAL_TZ_REGEX = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/i;

function parseNumeric(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const normalised = trimmed.replace(/[$,]/g, "");
    const parsed = Number(normalised);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function coerceIsoDate(rawDate: string | null, monthValue: string | null) {
  const stats = { source: "fallback" as "raw" | "month" | "fallback" };

  const normalise = (value: string | null): string | null => {
    if (!value) return null;
    let trimmed = value.trim();
    if (!trimmed) return null;

    if (DATE_ONLY_REGEX.test(trimmed)) {
      trimmed = `${trimmed}T00:00:00Z`;
    } else if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      trimmed = `${trimmed.replace(" ", "T")}Z`;
    } else if (DATETIME_WITH_OPTIONAL_TZ_REGEX.test(trimmed)) {
      trimmed = trimmed.replace(" ", "T");
      if (!/[Zz]$/.test(trimmed) && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
        trimmed = `${trimmed}Z`;
      }
    }

    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) return null;
    return new Date(parsed).toISOString();
  };

  const fromRaw = normalise(rawDate);
  if (fromRaw) {
    stats.source = "raw";
    return { iso: fromRaw, stats };
  }

  const month = typeof monthValue === "string" ? monthValue.trim() : "";
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const fromMonth = normalise(`${month}-15T00:00:00Z`);
    if (fromMonth) {
      stats.source = "month";
      return { iso: fromMonth, stats };
    }
  }

  return { iso: SALES_DATA_START_ISO, stats };
}

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
        .select("id, date, month, vendor, rep, invoice_total, sales_total, orders, order_quantity, profit_total")
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

    let monthFallbackCount = 0;
    let defaultFallbackCount = 0;

    const records: SalesRecord[] = rows
      .map((row, index) => {
        const { iso, stats } = coerceIsoDate(row.date as string | null, row.month as string | null);
        if (stats.source === "month") monthFallbackCount += 1;
        if (stats.source === "fallback") defaultFallbackCount += 1;

        return {
          id: (row.id as string) ?? `record-${index}`,
          date: iso,
          vendor: (row.vendor as string) || "Unknown Vendor",
          rep: (row.rep as string) || "Unknown Rep",
          invoiceTotal: parseNumeric(row.invoice_total ?? row.sales_total ?? 0),
          salesTotal: parseNumeric(row.sales_total ?? row.invoice_total ?? 0),
          orders: parseNumeric(row.orders ?? 0),
          orderQuantity: parseNumeric(row.order_quantity ?? row.orders ?? 0),
          profitTotal: parseNumeric(row.profit_total ?? 0),
        };
      })
      .filter((record) => {
        if (!record.date) return false;
        const parsedDate = new Date(record.date);
        return !Number.isNaN(parsedDate.getTime()) && parsedDate >= SALES_DATA_START;
      });

    const aggregateTotals = records.reduce(
      (acc, record) => {
        acc.revenue += record.invoiceTotal;
        acc.profit += record.profitTotal ?? 0;
        acc.orders += record.orders;
        return acc;
      },
      { revenue: 0, profit: 0, orders: 0 },
    );

    if (monthFallbackCount > 0 || defaultFallbackCount > 0) {
      console.warn(
        `[getSalesRecords] Adjusted ${monthFallbackCount} rows using month fallback and ${defaultFallbackCount} rows using default start date`,
      );
    }

    console.log(
      `[getSalesRecords] totals`,
      {
        count: records.length,
        revenue: aggregateTotals.revenue,
        profit: aggregateTotals.profit,
        orders: aggregateTotals.orders,
      },
    );

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
      profit?: number;
      margin?: number;
      customer?: string;
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
        profit: 25500,
        margin: 0.3,
        customer: "Acme Manufacturing",
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
        profit: 43750,
        margin: 0.35,
        customer: "Omni Logistics",
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
        profit: 26600,
        margin: 0.28,
        customer: "Brightline Distribution",
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
      .select("invoice_number, vendor, rep, invoice_total, sales_total, profit_total, date, description, customer")
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
      profit: number;
      closedAt: string;
      closedAtIso: string;
      product: string;
      sales: number;
      customer?: string;
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
          profit: 0,
          closedAt: formatDate(row.date as string | null),
          closedAtIso: isoDate,
          product: (row.description as string) || "High-Value Order",
          sales: 0,
          customer: (row.customer as string) || undefined,
        });
      }

      const entry = aggregate.get(invoice)!;
      const lineRevenue = Number(row.sales_total ?? row.invoice_total ?? 0) || 0;
      const lineProfit = Number(row.profit_total ?? 0) || 0;
      entry.value += lineRevenue;
      entry.sales += lineRevenue;
      entry.profit += lineProfit;
      if (!entry.product && row.description) {
        entry.product = row.description as string;
      }
      if (!entry.vendor && row.vendor) {
        entry.vendor = row.vendor as string;
      }
      if (!entry.rep && row.rep) {
        entry.rep = row.rep as string;
      }
      if (!entry.customer && row.customer) {
        entry.customer = row.customer as string;
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
        profit: item.profit,
        margin: item.value > 0 ? item.profit / item.value : undefined,
        customer: item.customer,
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

    // OPTIMIZATION: Only fetch data from the last 12 months to reduce load time
    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];

    // Supabase enforces a server-side max of 1000 rows per query
    // Fetch only last 12 months of data using pagination
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    const maxRows = 10000; // Safety limit to prevent excessive fetching

    while (hasMore && allData.length < maxRows) {
      const { data, error } = await supabase
        .from("all_time_sales")
        .select("date, month, sales_total, invoice_total, orders, order_quantity, vendor, rep")
        .gte("date", startDate)
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

    console.log(`[getSalesSnapshots] ✅ Fetched ${allData.length} rows from Supabase (last 12 months)`);

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

// ============================================================================
// Google Search Console (GSC) Data Services
// ============================================================================

/**
 * Get GSC overview metrics
 * Returns overall site performance for the specified date range
 */
export async function getGSCOverview(params?: {
  startDate?: string; // YYYY-MM-DD, defaults to 30 days ago
  endDate?: string;   // YYYY-MM-DD, defaults to today
}): Promise<
  ApiResponse<{
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    clicksChange: number;
    impressionsChange: number;
    ctrChange: number;
    positionChange: number;
  }>
> {
  try {
    const supabase = await getSupabaseServerClient();
    const endDate = params?.endDate || new Date().toISOString().split('T')[0];
    const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get current period data
    const { data: currentData, error } = await supabase
      .from('gsc_site_performance')
      .select('clicks, impressions, ctr, position')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    if (!currentData || currentData.length === 0) {
      return {
        data: {
          totalClicks: 0,
          totalImpressions: 0,
          avgCtr: 0,
          avgPosition: 0,
          clicksChange: 0,
          impressionsChange: 0,
          ctrChange: 0,
          positionChange: 0,
        },
        source: "supabase",
        warning: "No GSC data found for this date range"
      };
    }

    const totalClicks = currentData.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalImpressions = currentData.reduce((sum, row) => sum + (row.impressions || 0), 0);

    // Calculate aggregate CTR (Clicks / Impressions)
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    // Calculate weighted average position (Sum(Position * Impressions) / Total Impressions)
    const weightedPositionSum = currentData.reduce((sum, row) => sum + ((row.position || 0) * (row.impressions || 0)), 0);
    const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;

    // Get previous period for comparison
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000));
    const prevStartDate = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = new Date(new Date(startDate).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: prevData } = await supabase
      .from('gsc_site_performance')
      .select('clicks, impressions, ctr, position')
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    let clicksChange = 0;
    let impressionsChange = 0;
    let ctrChange = 0;
    let positionChange = 0;

    if (prevData && prevData.length > 0) {
      const prevClicks = prevData.reduce((sum, row) => sum + (row.clicks || 0), 0);
      const prevImpressions = prevData.reduce((sum, row) => sum + (row.impressions || 0), 0);

      const prevCtr = prevImpressions > 0 ? prevClicks / prevImpressions : 0;

      const prevWeightedPositionSum = prevData.reduce((sum, row) => sum + ((row.position || 0) * (row.impressions || 0)), 0);
      const prevPosition = prevImpressions > 0 ? prevWeightedPositionSum / prevImpressions : 0;

      clicksChange = prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks) * 100 : 0;
      impressionsChange = prevImpressions > 0 ? ((totalImpressions - prevImpressions) / prevImpressions) * 100 : 0;
      ctrChange = prevCtr > 0 ? ((avgCtr - prevCtr) / prevCtr) * 100 : 0;
      positionChange = prevPosition > 0 ? ((avgPosition - prevPosition) / prevPosition) * 100 : 0;
    }

    return {
      data: {
        totalClicks,
        totalImpressions,
        avgCtr,
        avgPosition,
        clicksChange,
        impressionsChange,
        ctrChange,
        positionChange,
      },
      source: "supabase",
    };
  } catch (error: any) {
    console.error('Error fetching GSC overview:', error);
    return {
      data: {
        totalClicks: 0,
        totalImpressions: 0,
        avgCtr: 0,
        avgPosition: 0,
        clicksChange: 0,
        impressionsChange: 0,
        ctrChange: 0,
        positionChange: 0,
      },
      source: "sample",
      error: error.message,
    };
  }
}

/**
 * Get top search queries from GSC
 */
export async function getGSCTopQueries(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<
  ApiResponse<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[]>
> {
  try {
    const supabase = await getSupabaseServerClient();
    const endDate = params?.endDate || new Date().toISOString().split('T')[0];
    const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = params?.limit || 20;

    console.log(`[getGSCTopQueries] Fetching for ${startDate} to ${endDate} (Limit: ${limit})`);

    // Try using RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_gsc_top_queries', {
      start_date: startDate,
      end_date: endDate,
      limit_count: limit
    });

    if (rpcError) {
      console.error('[getGSCTopQueries] RPC Error:', rpcError);
    } else {
      console.log(`[getGSCTopQueries] RPC Success. Rows: ${rpcData?.length}`);
    }

    if (!rpcError && rpcData) {
      return {
        data: rpcData,
        source: "supabase",
      };
    }

    // Fallback to old method if RPC fails
    if (rpcError) {
      console.warn('RPC get_gsc_top_queries failed, falling back to client-side aggregation:', rpcError.message);
    }

    const { data, error } = await supabase
      .from('gsc_search_queries')
      .select('query, clicks, impressions, ctr, position')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('clicks', { ascending: false })
      .limit(1000); // Increased limit for better client-side aggregation

    if (error) throw error;

    // Aggregate by query (sum clicks/impressions, avg ctr/position)
    const queryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>();

    (data || []).forEach(row => {
      const existing = queryMap.get(row.query) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
      queryMap.set(row.query, {
        clicks: existing.clicks + (row.clicks || 0),
        impressions: existing.impressions + (row.impressions || 0),
        ctr: existing.ctr + (row.ctr || 0),
        position: existing.position + (row.position || 0),
        count: existing.count + 1,
      });
    });

    const aggregatedData = Array.from(queryMap.entries())
      .map(([query, stats]) => ({
        query,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.ctr / stats.count,
        position: stats.position / stats.count,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);

    return {
      data: aggregatedData,
      source: "supabase",
    };
  } catch (error: any) {
    console.error('Error fetching GSC top queries:', error);
    return {
      data: [],
      source: "sample",
      error: error.message,
    };
  }
}

/**
 * Get top pages from GSC
 */
export async function getGSCTopPages(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<
  ApiResponse<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[]>
> {
  try {
    const supabase = await getSupabaseServerClient();
    const endDate = params?.endDate || new Date().toISOString().split('T')[0];
    const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = params?.limit || 20;

    // Try using RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_gsc_top_pages', {
      start_date: startDate,
      end_date: endDate,
      limit_count: limit
    });

    if (!rpcError && rpcData) {
      return {
        data: rpcData,
        source: "supabase",
      };
    }

    // Fallback to old method if RPC fails
    if (rpcError) {
      console.warn('RPC get_gsc_top_pages failed, falling back to client-side aggregation:', rpcError.message);
    }

    const { data, error } = await supabase
      .from('gsc_page_performance')
      .select('page, clicks, impressions, ctr, position')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('clicks', { ascending: false })
      .limit(1000); // Increased limit for better client-side aggregation

    if (error) throw error;

    // Aggregate by page
    const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>();

    (data || []).forEach(row => {
      const existing = pageMap.get(row.page) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
      pageMap.set(row.page, {
        clicks: existing.clicks + (row.clicks || 0),
        impressions: existing.impressions + (row.impressions || 0),
        ctr: existing.ctr + (row.ctr || 0),
        position: existing.position + (row.position || 0),
        count: existing.count + 1,
      });
    });

    const aggregatedData = Array.from(pageMap.entries())
      .map(([page, stats]) => ({
        page,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.ctr / stats.count,
        position: stats.position / stats.count,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);

    return {
      data: aggregatedData,
      source: "supabase",
    };
  } catch (error: any) {
    console.error('Error fetching GSC top pages:', error);
    return {
      data: [],
      source: "sample",
      error: error.message,
    };
  }
}

/**
 * Get device breakdown from GSC
 */
export async function getGSCDeviceBreakdown(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[]>
> {
  try {
    const supabase = await getSupabaseServerClient();
    const endDate = params?.endDate || new Date().toISOString().split('T')[0];
    const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('gsc_device_performance')
      .select('device, clicks, impressions, ctr, position')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Aggregate by device
    const deviceMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>();

    (data || []).forEach(row => {
      const existing = deviceMap.get(row.device) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
      deviceMap.set(row.device, {
        clicks: existing.clicks + (row.clicks || 0),
        impressions: existing.impressions + (row.impressions || 0),
        ctr: existing.ctr + (row.ctr || 0),
        position: existing.position + (row.position || 0),
        count: existing.count + 1,
      });
    });

    const aggregatedData = Array.from(deviceMap.entries())
      .map(([device, stats]) => ({
        device,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.ctr / stats.count,
        position: stats.position / stats.count,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    return {
      data: aggregatedData,
      source: "supabase",
    };
  } catch (error: any) {
    console.error('Error fetching GSC device breakdown:', error);
    return {
      data: [],
      source: "sample",
      error: error.message,
    };
  }
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

    // Fetch ALL data using pagination to get complete dataset
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("all_time_sales")
        .select("sku, description, vendor, product_category, overall_product_category, order_quantity, sales_total, profit_total, orders, roi, sales_each, date")
        .gte("date", SALES_DATA_START_DATE)
        .range(from, from + pageSize - 1);

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);
      }

      const { data: pageData, error } = await query;

      if (error) {
        console.error("Error fetching page:", error);
        break;
      }

      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(pageData);
        from += pageSize;

        // If we got less than pageSize, we're done
        if (pageData.length < pageSize) {
          hasMore = false;
        }
      }
    }

    const data = allData;
    const error = null;

    console.log(`[Top Products] Fetched ${data?.length || 0} rows from all_time_sales`);

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
        error: (error as any)?.message || String(error),
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
          price_count: 0,
          // Track revenue by year for trend calculation
          revenue_2023: 0,
          revenue_2024: 0,
          revenue_2025: 0,
          months_2023: new Set(),
          months_2024: new Set(),
          months_2025: new Set()
        });
      }

      const agg = aggregated.get(key)!;
      agg.total_sales += row.order_quantity || 0;
      agg.total_revenue += row.sales_total || 0;
      agg.total_profit += row.profit_total || 0;
      agg.total_orders += row.orders || 0;

      // Track revenue by year
      if (row.date) {
        const year = new Date(row.date).getFullYear();
        const month = new Date(row.date).toISOString().slice(0, 7); // YYYY-MM
        const revenue = row.sales_total || 0;

        if (year === 2023) {
          agg.revenue_2023 += revenue;
          agg.months_2023.add(month);
        } else if (year === 2024) {
          agg.revenue_2024 += revenue;
          agg.months_2024.add(month);
        } else if (year === 2025) {
          agg.revenue_2025 += revenue;
          agg.months_2025.add(month);
        }
      }

      if (row.roi) {
        agg.roi_sum += row.roi;
        agg.roi_count += 1;
      }

      if (row.sales_each) {
        agg.price_sum += row.sales_each;
        agg.price_count += 1;
      }
    });

    // Calculate averages and sort by revenue (no limit - show all products)
    const result = Array.from(aggregated.values())
      .map(item => {
        // Calculate average monthly revenue for each year
        const avgMonthly2023 = item.months_2023.size > 0 ? item.revenue_2023 / item.months_2023.size : 0;
        const avgMonthly2024 = item.months_2024.size > 0 ? item.revenue_2024 / item.months_2024.size : 0;
        const avgMonthly2025 = item.months_2025.size > 0 ? item.revenue_2025 / item.months_2025.size : 0;

        // Calculate baseline (2023 & 2024 combined average)
        const baseline = (avgMonthly2023 + avgMonthly2024) / 2;

        // Calculate trend: % change from baseline to 2025
        const trend_2025 = baseline > 0 ? (avgMonthly2025 - baseline) / baseline : null;

        return {
          sku: item.sku,
          description: item.description,
          vendor: item.vendor,
          product_category: item.product_category,
          overall_product_category: item.overall_product_category,
          total_sales: item.total_sales,
          total_revenue: item.total_revenue,
          total_profit: item.total_profit,
          total_orders: item.total_orders,
          avg_roi: item.total_revenue > 0 ? item.total_profit / item.total_revenue : 0,
          avg_price: item.price_count > 0 ? item.price_sum / item.price_count : 0,
          trend_2025: trend_2025
        };
      })
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 100); // Limit to top 100 products

    const totalRevenue = result.reduce((sum, p) => sum + p.total_revenue, 0);
    console.log(`[Top Products] Showing top ${result.length} products, Total Revenue: $${totalRevenue.toLocaleString()}`);

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

// =====================================================
// GA4 ANALYTICS DATA SERVICE FUNCTIONS
// =====================================================

export type GA4DailyTraffic = {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
  engagementRate: number;
  bounceRate: number;
  averageSessionDuration: number;
  pageviews: number;
};

export type GA4TrafficSource = {
  date: string;
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  users: number;
  newUsers: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
};

export type GA4PagePerformance = {
  date: string;
  pagePath: string;
  pageTitle: string;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exits: number;
};

export type GA4Conversion = {
  date: string;
  conversionEvent: string;
  source: string;
  medium: string;
  campaign: string;
  conversions: number;
  conversionValue: number;
};

export type GA4EcommerceTransaction = {
  date: string;
  transactionId: string;
  source: string;
  medium: string;
  campaign: string;
  revenue: number;
  tax: number;
  shipping: number;
  itemsPurchased: number;
};

// GA4 Daily Traffic
export async function getGA4DailyTraffic(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<GA4DailyTraffic[]> & { refreshedAt: string }> {
  const fallback = {
    data: [
      {
        date: "2025-01-17",
        sessions: 1250,
        users: 980,
        newUsers: 420,
        engagedSessions: 890,
        engagementRate: 71.2,
        bounceRate: 28.8,
        averageSessionDuration: 185.5,
        pageviews: 3420,
      },
      {
        date: "2025-01-16",
        sessions: 1180,
        users: 920,
        newUsers: 390,
        engagedSessions: 850,
        engagementRate: 72.0,
        bounceRate: 28.0,
        averageSessionDuration: 190.2,
        pageviews: 3210,
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("ga4_daily_traffic")
      .select("*")
      .order("date", { ascending: false })
      .limit(1000);

    if (dateRange) {
      query = query.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching GA4 daily traffic:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("GA4 daily traffic: No data found in table");
      return fallback;
    }

    console.log(`[GA4 Daily Traffic] ✅ Fetched ${data.length} rows from Supabase`);

    const result: GA4DailyTraffic[] = data.map((row) => ({
      date: row.date,
      sessions: Number(row.sessions ?? 0),
      users: Number(row.users ?? 0),
      newUsers: Number(row.new_users ?? 0),
      engagedSessions: Number(row.engaged_sessions ?? 0),
      engagementRate: Number(row.engagement_rate ?? 0),
      bounceRate: Number(row.bounce_rate ?? 0),
      averageSessionDuration: Number(row.average_session_duration ?? 0),
      pageviews: Number(row.pageviews ?? 0),
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GA4 daily traffic:", error);
    return fallback;
  }
}

// GA4 Traffic Sources
export async function getGA4TrafficSources(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<GA4TrafficSource[]> & { refreshedAt: string }> {
  const fallback = {
    data: [
      {
        date: "2025-01-17",
        source: "google",
        medium: "organic",
        campaign: "(not set)",
        sessions: 650,
        users: 520,
        newUsers: 230,
        conversions: 42,
        conversionRate: 6.46,
        revenue: 8400.0,
      },
      {
        date: "2025-01-17",
        source: "direct",
        medium: "(none)",
        campaign: "(not set)",
        sessions: 380,
        users: 290,
        newUsers: 120,
        conversions: 28,
        conversionRate: 7.37,
        revenue: 5600.0,
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("ga4_traffic_sources")
      .select("*")
      .order("date", { ascending: false })
      .limit(5000);

    if (dateRange) {
      query = query.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching GA4 traffic sources:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("GA4 traffic sources: No data found in table");
      return fallback;
    }

    console.log(`[GA4 Traffic Sources] ✅ Fetched ${data.length} rows from Supabase`);

    const result: GA4TrafficSource[] = data.map((row) => ({
      date: row.date,
      source: row.source ?? "(not set)",
      medium: row.medium ?? "(not set)",
      campaign: row.campaign ?? "(not set)",
      sessions: Number(row.sessions ?? 0),
      users: Number(row.users ?? 0),
      newUsers: Number(row.new_users ?? 0),
      conversions: Number(row.conversions ?? 0),
      conversionRate: Number(row.conversion_rate ?? 0),
      revenue: Number(row.revenue ?? 0),
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GA4 traffic sources:", error);
    return fallback;
  }
}

// GA4 Page Performance
export async function getGA4PagePerformance(
  dateRange?: { start: string; end: string },
  limit: number = 50
): Promise<ApiResponse<GA4PagePerformance[]> & { refreshedAt: string }> {
  const fallback = {
    data: [
      {
        date: "2025-01-17",
        pagePath: "/",
        pageTitle: "Home",
        pageviews: 850,
        uniquePageviews: 620,
        avgTimeOnPage: 125.5,
        bounceRate: 32.5,
        exits: 210,
      },
      {
        date: "2025-01-17",
        pagePath: "/products",
        pageTitle: "Products",
        pageviews: 620,
        uniquePageviews: 480,
        avgTimeOnPage: 145.2,
        bounceRate: 28.3,
        exits: 180,
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("ga4_page_performance")
      .select("*")
      .order("pageviews", { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      console.warn("Supabase error fetching GA4 page performance:", error);
      return fallback;
    }

    const result: GA4PagePerformance[] = data.map((row) => ({
      date: row.date,
      pagePath: row.page_path ?? "/",
      pageTitle: row.page_title ?? "Untitled",
      pageviews: Number(row.pageviews ?? 0),
      uniquePageviews: Number(row.unique_pageviews ?? 0),
      avgTimeOnPage: Number(row.avg_time_on_page ?? 0),
      bounceRate: Number(row.bounce_rate ?? 0),
      exits: Number(row.exits ?? 0),
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GA4 page performance:", error);
    return fallback;
  }
}

// GA4 Conversions
export async function getGA4Conversions(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<GA4Conversion[]> & { refreshedAt: string }> {
  const fallback = {
    data: [
      {
        date: "2025-01-17",
        conversionEvent: "purchase",
        source: "google",
        medium: "organic",
        campaign: "(not set)",
        conversions: 42,
        conversionValue: 8400.0,
      },
      {
        date: "2025-01-17",
        conversionEvent: "add_to_cart",
        source: "google",
        medium: "organic",
        campaign: "(not set)",
        conversions: 125,
        conversionValue: 0,
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("ga4_conversions")
      .select("*")
      .order("date", { ascending: false })
      .limit(5000);

    if (dateRange) {
      query = query.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching GA4 conversions:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("GA4 conversions: No data found in table");
      return fallback;
    }

    console.log(`[GA4 Conversions] ✅ Fetched ${data.length} rows from Supabase`);

    const result: GA4Conversion[] = data.map((row) => ({
      date: row.date,
      conversionEvent: row.conversion_event ?? "unknown",
      source: row.source ?? "(not set)",
      medium: row.medium ?? "(not set)",
      campaign: row.campaign ?? "(not set)",
      conversions: Number(row.conversions ?? 0),
      conversionValue: Number(row.conversion_value ?? 0),
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GA4 conversions:", error);
    return fallback;
  }
}

// GA4 E-commerce Transactions
export async function getGA4EcommerceTransactions(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<GA4EcommerceTransaction[]> & { refreshedAt: string }> {
  const fallback = {
    data: [
      {
        date: "2025-01-17",
        transactionId: "T12345",
        source: "google",
        medium: "organic",
        campaign: "(not set)",
        revenue: 250.0,
        tax: 20.0,
        shipping: 15.0,
        itemsPurchased: 3,
      },
    ],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("ga4_ecommerce_transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(5000);

    if (dateRange) {
      query = query.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching GA4 e-commerce transactions:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("GA4 e-commerce transactions: No data found in table");
      return fallback;
    }

    console.log(`[GA4 E-commerce Transactions] ✅ Fetched ${data.length} rows from Supabase`);

    const result: GA4EcommerceTransaction[] = data.map((row) => ({
      date: row.date,
      transactionId: row.transaction_id ?? "unknown",
      source: row.source ?? "(not set)",
      medium: row.medium ?? "(not set)",
      campaign: row.campaign ?? "(not set)",
      revenue: Number(row.revenue ?? 0),
      tax: Number(row.tax ?? 0),
      shipping: Number(row.shipping ?? 0),
      itemsPurchased: Number(row.items_purchased ?? 0),
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching GA4 e-commerce transactions:", error);
    return fallback;
  }
}

// =====================================================
// SHOPIFY DATA SERVICE FUNCTIONS
// =====================================================

export type ShopifyOrder = {
  orderId: number;
  orderNumber: string;
  name: string;
  email: string;
  createdAt: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  totalShipping: number;
  financialStatus: string;
  fulfillmentStatus: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingCountry: string | null;
  lineItemsCount: number;
};

export type ShopifyDailySales = {
  date: string;
  ordersCount: number;
  totalSales: number;
  totalTax: number;
  totalShipping: number;
  totalDiscounts: number;
  averageOrderValue: number;
};

export type ShopifyProduct = {
  productId: number;
  title: string;
  vendor: string;
  productType: string;
  status: string;
  totalInventory: number;
  variantsCount: number;
  createdAt: string;
};

export type ShopifyCustomer = {
  customerId: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  defaultCity: string | null;
  defaultCountry: string | null;
};

export type ShopifyProductSales = {
  productId: number;
  productTitle: string;
  vendor: string;
  productType: string;
  ordersCount: number;
  unitsSold: number;
  totalRevenue: number;
  avgPrice: number;
};

// Shopify Orders
export async function getShopifyOrders(
  dateRange?: { start: string; end: string },
  limit: number = 1000
): Promise<ApiResponse<ShopifyOrder[]> & { refreshedAt: string }> {
  const fallback = {
    data: [] as ShopifyOrder[],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("shopify_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (dateRange) {
      query = query.gte("created_at", dateRange.start).lte("created_at", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching Shopify orders:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("Shopify orders: No data found in table");
      return fallback;
    }

    console.log(`[Shopify Orders] ✅ Fetched ${data.length} rows from Supabase`);

    const result: ShopifyOrder[] = data.map((row) => ({
      orderId: row.order_id,
      orderNumber: row.order_number ?? "",
      name: row.name ?? "",
      email: row.email ?? "",
      createdAt: row.created_at ?? "",
      totalPrice: Number(row.total_price ?? 0),
      subtotalPrice: Number(row.subtotal_price ?? 0),
      totalTax: Number(row.total_tax ?? 0),
      totalDiscounts: Number(row.total_discounts ?? 0),
      totalShipping: Number(row.total_shipping ?? 0),
      financialStatus: row.financial_status ?? "unknown",
      fulfillmentStatus: row.fulfillment_status,
      customerFirstName: row.customer_first_name,
      customerLastName: row.customer_last_name,
      shippingCity: row.shipping_address_city,
      shippingProvince: row.shipping_address_province,
      shippingCountry: row.shipping_address_country,
      lineItemsCount: row.line_items_count ?? 0,
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify orders:", error);
    return fallback;
  }
}

// Shopify Daily Sales Aggregation
export async function getShopifyDailySales(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<ShopifyDailySales[]> & { refreshedAt: string }> {
  const fallback = {
    data: [] as ShopifyDailySales[],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();

    // Aggregate orders by date
    let query = supabase
      .from("shopify_orders")
      .select("created_at, total_price, total_tax, total_shipping, total_discounts")
      .order("created_at", { ascending: true });

    if (dateRange) {
      query = query.gte("created_at", dateRange.start).lte("created_at", dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching Shopify daily sales:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("Shopify daily sales: No data found");
      return fallback;
    }

    // Aggregate by date
    const dailyMap = new Map<string, {
      ordersCount: number;
      totalSales: number;
      totalTax: number;
      totalShipping: number;
      totalDiscounts: number;
    }>();

    for (const row of data) {
      const date = row.created_at ? row.created_at.split("T")[0] : "";
      if (!date) continue;

      const existing = dailyMap.get(date) || {
        ordersCount: 0,
        totalSales: 0,
        totalTax: 0,
        totalShipping: 0,
        totalDiscounts: 0,
      };

      existing.ordersCount += 1;
      existing.totalSales += Number(row.total_price ?? 0);
      existing.totalTax += Number(row.total_tax ?? 0);
      existing.totalShipping += Number(row.total_shipping ?? 0);
      existing.totalDiscounts += Number(row.total_discounts ?? 0);

      dailyMap.set(date, existing);
    }

    const result: ShopifyDailySales[] = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        ordersCount: stats.ordersCount,
        totalSales: stats.totalSales,
        totalTax: stats.totalTax,
        totalShipping: stats.totalShipping,
        totalDiscounts: stats.totalDiscounts,
        averageOrderValue: stats.ordersCount > 0 ? stats.totalSales / stats.ordersCount : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[Shopify Daily Sales] ✅ Aggregated ${result.length} days from Supabase`);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify daily sales:", error);
    return fallback;
  }
}

// Shopify Products
export async function getShopifyProducts(
  limit: number = 1000
): Promise<ApiResponse<ShopifyProduct[]> & { refreshedAt: string }> {
  const fallback = {
    data: [] as ShopifyProduct[],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("shopify_products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Supabase error fetching Shopify products:", error);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn("Shopify products: No data found in table");
      return fallback;
    }

    console.log(`[Shopify Products] ✅ Fetched ${data.length} rows from Supabase`);

    const result: ShopifyProduct[] = data.map((row) => ({
      productId: row.product_id,
      title: row.title ?? "",
      vendor: row.vendor ?? "",
      productType: row.product_type ?? "",
      status: row.status ?? "unknown",
      totalInventory: row.total_inventory ?? 0,
      variantsCount: row.variants_count ?? 0,
      createdAt: row.created_at ?? "",
    }));

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return fallback;
  }
}

// Shopify Customers
export async function getShopifyCustomers(
  limit: number = 1000
): Promise<ApiResponse<ShopifyCustomer[]> & { refreshedAt: string }> {
  const fallback = {
    data: [] as ShopifyCustomer[],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();

    // Try to get from customers table first
    const { data: customersData, error: customersError } = await supabase
      .from("shopify_customers")
      .select("*")
      .order("total_spent", { ascending: false })
      .limit(limit);

    if (!customersError && customersData && customersData.length > 0) {
      console.log(`[Shopify Customers] ✅ Fetched ${customersData.length} rows from shopify_customers table`);

      const result: ShopifyCustomer[] = customersData.map((row) => ({
        customerId: row.customer_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        ordersCount: row.orders_count ?? 0,
        totalSpent: Number(row.total_spent ?? 0),
        createdAt: row.created_at ?? "",
        defaultCity: row.default_city,
        defaultCountry: row.default_country,
      }));

      return {
        data: result,
        source: "supabase",
        refreshedAt: new Date().toISOString(),
      };
    }

    // Fallback: derive customers from orders table
    console.warn("Shopify customers table empty, deriving from orders...");

    const { data: ordersData, error: ordersError } = await supabase
      .from("shopify_orders")
      .select("customer_email, customer_first_name, customer_last_name, total_price, created_at, shipping_address_city, shipping_address_country")
      .eq("financial_status", "paid");

    if (ordersError || !ordersData) {
      console.warn("Could not derive customers from orders:", ordersError);
      return fallback;
    }

    // Aggregate by email
    const customerMap = new Map<string, ShopifyCustomer>();

    for (const order of ordersData) {
      const email = order.customer_email || "guest@unknown.com";

      if (customerMap.has(email)) {
        const customer = customerMap.get(email)!;
        customer.ordersCount += 1;
        customer.totalSpent += Number(order.total_price ?? 0);
      } else {
        customerMap.set(email, {
          customerId: 0, // No customer ID from orders
          email,
          firstName: order.customer_first_name || null,
          lastName: order.customer_last_name || null,
          ordersCount: 1,
          totalSpent: Number(order.total_price ?? 0),
          createdAt: order.created_at || "",
          defaultCity: order.shipping_address_city || null,
          defaultCountry: order.shipping_address_country || null,
        });
      }
    }

    const result = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    console.log(`[Shopify Customers] ✅ Derived ${result.length} customers from orders`);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify customers:", error);
    return fallback;
  }
}

// Shopify Product Sales (from view)
export async function getShopifyProductSales(
  limit: number = 100
): Promise<ApiResponse<ShopifyProductSales[]> & { refreshedAt: string }> {
  const fallback = {
    data: [] as ShopifyProductSales[],
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();

    // Try view first
    const { data: viewData, error: viewError } = await supabase
      .from("shopify_product_sales")
      .select("*")
      .order("total_revenue", { ascending: false })
      .limit(limit);

    if (!viewError && viewData && viewData.length > 0) {
      console.log(`[Shopify Product Sales] ✅ Fetched ${viewData.length} rows from view`);

      const result: ShopifyProductSales[] = viewData.map((row) => ({
        productId: row.product_id ?? 0,
        productTitle: row.product_title ?? "Unknown Product",
        vendor: row.vendor,
        productType: row.product_type,
        ordersCount: row.orders_count ?? 0,
        unitsSold: row.units_sold ?? 0,
        totalRevenue: Number(row.total_revenue ?? 0),
        avgPrice: Number(row.avg_price ?? 0),
      }));

      return {
        data: result,
        source: "supabase",
        refreshedAt: new Date().toISOString(),
      };
    }

    // Fallback: derive from line items
    console.warn("Shopify product_sales view empty, deriving from line items...");

    const { data: lineItemsData, error: lineItemsError } = await supabase
      .from("shopify_order_line_items")
      .select("title, sku, vendor, quantity, price, order_id");

    if (lineItemsError || !lineItemsData) {
      console.warn("Could not derive product sales from line items:", lineItemsError);
      return fallback;
    }

    // Get paid orders
    const { data: paidOrders, error: ordersError } = await supabase
      .from("shopify_orders")
      .select("order_id")
      .eq("financial_status", "paid");

    if (ordersError || !paidOrders) {
      console.warn("Could not fetch paid orders:", ordersError);
      return fallback;
    }

    const paidOrderIds = new Set(paidOrders.map((o) => o.order_id));

    // Aggregate by title
    const productMap = new Map<string, ShopifyProductSales>();

    for (const item of lineItemsData) {
      // Only count items from paid orders
      if (!paidOrderIds.has(item.order_id)) continue;

      const key = item.title || "Unknown Product";

      if (productMap.has(key)) {
        const product = productMap.get(key)!;
        product.unitsSold += item.quantity || 0;
        product.totalRevenue += (item.quantity || 0) * Number(item.price || 0);
        product.ordersCount += 1;
      } else {
        productMap.set(key, {
          productId: 0,
          productTitle: key,
          vendor: item.vendor || "",
          productType: "",
          ordersCount: 1,
          unitsSold: item.quantity || 0,
          totalRevenue: (item.quantity || 0) * Number(item.price || 0),
          avgPrice: Number(item.price || 0),
        });
      }
    }

    // Calculate average price
    for (const product of productMap.values()) {
      if (product.unitsSold > 0) {
        product.avgPrice = product.totalRevenue / product.unitsSold;
      }
    }

    const result = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    console.log(`[Shopify Product Sales] ✅ Derived ${result.length} products from line items`);

    return {
      data: result,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify product sales:", error);
    return fallback;
  }
}

// Shopify Summary Stats
export async function getShopifySummaryStats(): Promise<ApiResponse<{
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
}> & { refreshedAt: string }> {
  const fallback = {
    data: {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      totalProducts: 0,
      averageOrderValue: 0,
    },
    source: "sample" as const,
    refreshedAt: new Date().toISOString(),
  };

  try {
    const supabase = await getSupabaseServerClient();

    // Get order count and total revenue using aggregation
    const { count: totalOrders, error: orderCountError } = await supabase
      .from("shopify_orders")
      .select("*", { count: "exact", head: true })
      .eq("financial_status", "paid");

    if (orderCountError) {
      console.warn("Supabase error fetching Shopify order count:", orderCountError);
    }

    // Get revenue sum - need to fetch all paid orders for aggregation
    // Use RPC or fetch with higher limit
    const { data: revenueData, error: revenueError } = await supabase
      .from("shopify_orders")
      .select("total_price")
      .eq("financial_status", "paid")
      .limit(10000); // Increase limit to cover all orders

    const totalRevenue = revenueData?.reduce((sum, row) => sum + Number(row.total_price ?? 0), 0) ?? 0;

    if (revenueError) {
      console.warn("Supabase error fetching Shopify revenue:", revenueError);
    }

    // Get unique customer count from orders
    const { data: customersData, error: customersError } = await supabase
      .from("shopify_orders")
      .select("customer_email")
      .eq("financial_status", "paid")
      .limit(10000);

    const uniqueCustomers = new Set(
      customersData?.map((o) => o.customer_email).filter((e) => e) ?? []
    ).size;

    if (customersError) {
      console.warn("Supabase error fetching customers for count:", customersError);
    }

    // Get product count from line items
    const { data: productsData, error: productsError } = await supabase
      .from("shopify_order_line_items")
      .select("title")
      .limit(15000);

    const uniqueProducts = new Set(
      productsData?.map((p) => p.title).filter((t) => t) ?? []
    ).size;

    if (productsError) {
      console.warn("Supabase error fetching products for count:", productsError);
    }

    const finalOrderCount = totalOrders ?? 0;
    const averageOrderValue = finalOrderCount > 0 ? totalRevenue / finalOrderCount : 0;

    console.log(`[Shopify Summary] ✅ Orders: ${finalOrderCount}, Revenue: $${totalRevenue.toFixed(2)}, Customers: ${uniqueCustomers}, Products: ${uniqueProducts}`);

    return {
      data: {
        totalOrders: finalOrderCount,
        totalRevenue,
        totalCustomers: uniqueCustomers,
        totalProducts: uniqueProducts,
        averageOrderValue,
      },
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Shopify summary stats:", error);
    return fallback;
  }
}

// =====================================================
// SYNC LOGS - Unified view of all integration syncs
// =====================================================

export type SyncLogEntry = {
  id: number;
  integration: string;
  syncType?: string;
  status: "running" | "success" | "partial" | "failed";
  startedAt: string;
  completedAt: string | null;
  duration: number | null; // in seconds
  recordsSynced: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  errors?: string[];
  metadata?: Record<string, any>;
};

export type SyncLogSummary = {
  integration: string;
  lastSyncAt: string | null;
  lastSyncStatus: "running" | "success" | "partial" | "failed" | "never";
  totalSyncs: number;
  successRate: number;
  totalRecordsSynced: number;
  avgDuration: number | null; // in seconds
  lastError: string | null;
};

/**
 * Get all sync logs across all integrations
 */
export async function getAllSyncLogs(options: {
  limit?: number;
  offset?: number;
  integration?: string;
  status?: string;
} = {}): Promise<ApiResponse<SyncLogEntry[]>> {
  const { limit = 100, offset = 0, integration, status } = options;

  try {
    const supabase = await getSupabaseServerClient();

    // Fetch from all sync log tables
    const [asanaLogs, ga4Logs, gscLogs] = await Promise.all([
      supabase
        .from("asana_sync_log")
        .select("*")
        .order("sync_started_at", { ascending: false })
        .limit(50),
      supabase
        .from("ga4_sync_log")
        .select("*")
        .order("sync_started_at", { ascending: false })
        .limit(50),
      supabase
        .from("gsc_sync_log")
        .select("*")
        .order("sync_started_at", { ascending: false })
        .limit(50),
    ]);

    // Combine and normalize all logs
    const allLogs: SyncLogEntry[] = [];

    // Asana logs
    if (asanaLogs.data) {
      asanaLogs.data.forEach((log: any) => {
        const startedAt = new Date(log.sync_started_at);
        const completedAt = log.sync_completed_at ? new Date(log.sync_completed_at) : null;
        const duration = completedAt ? (completedAt.getTime() - startedAt.getTime()) / 1000 : null;

        allLogs.push({
          id: log.id,
          integration: "Asana",
          syncType: log.sync_type,
          status: log.status,
          startedAt: log.sync_started_at,
          completedAt: log.sync_completed_at,
          duration,
          recordsSynced: log.records_synced || 0,
          recordsCreated: log.records_created,
          recordsUpdated: log.records_updated,
          errors: log.errors,
          metadata: log.metadata,
        });
      });
    }

    // GA4 logs
    if (ga4Logs.data) {
      ga4Logs.data.forEach((log: any) => {
        const startedAt = new Date(log.sync_started_at);
        const completedAt = log.sync_completed_at ? new Date(log.sync_completed_at) : null;
        const duration = completedAt ? (completedAt.getTime() - startedAt.getTime()) / 1000 : null;

        allLogs.push({
          id: log.id,
          integration: "Google Analytics",
          status: log.status,
          startedAt: log.sync_started_at,
          completedAt: log.sync_completed_at,
          duration,
          recordsSynced: log.records_synced || 0,
          dateRangeStart: log.date_range_start,
          dateRangeEnd: log.date_range_end,
          errors: log.errors,
        });
      });
    }

    // GSC logs
    if (gscLogs.data) {
      gscLogs.data.forEach((log: any) => {
        const startedAt = new Date(log.sync_started_at);
        const completedAt = log.sync_completed_at ? new Date(log.sync_completed_at) : null;
        const duration = completedAt ? (completedAt.getTime() - startedAt.getTime()) / 1000 : null;

        allLogs.push({
          id: log.id,
          integration: "Google Search Console",
          status: log.status,
          startedAt: log.sync_started_at,
          completedAt: log.sync_completed_at,
          duration,
          recordsSynced: log.records_synced || 0,
          dateRangeStart: log.date_range_start,
          dateRangeEnd: log.date_range_end,
          errors: log.errors ? [log.errors] : undefined,
        });
      });
    }

    // Sort by most recent first
    allLogs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    // Apply filters
    let filtered = allLogs;
    if (integration) {
      filtered = filtered.filter(log => log.integration === integration);
    }
    if (status) {
      filtered = filtered.filter(log => log.status === status);
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return { data: [] };
  }
}

/**
 * Get sync summary for each integration
 */
export async function getSyncLogSummaries(): Promise<ApiResponse<SyncLogSummary[]>> {
  try {
    const supabase = await getSupabaseServerClient();

    const summaries: SyncLogSummary[] = [];

    // Asana summary
    const { data: asanaLogs } = await supabase
      .from("asana_sync_log")
      .select("*")
      .order("sync_started_at", { ascending: false });

    if (asanaLogs && asanaLogs.length > 0) {
      const lastSync = asanaLogs[0];
      const successCount = asanaLogs.filter((l: any) => l.status === "success").length;
      const totalRecords = asanaLogs.reduce((sum: number, l: any) => sum + (l.records_synced || 0), 0);
      const completedSyncs = asanaLogs.filter((l: any) => l.sync_completed_at);
      const avgDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum: number, l: any) => {
          const duration = (new Date(l.sync_completed_at).getTime() - new Date(l.sync_started_at).getTime()) / 1000;
          return sum + duration;
        }, 0) / completedSyncs.length
        : null;
      const lastError = asanaLogs.find((l: any) => l.errors && l.errors.length > 0)?.errors?.[0] || null;

      summaries.push({
        integration: "Asana",
        lastSyncAt: lastSync.sync_completed_at || lastSync.sync_started_at,
        lastSyncStatus: lastSync.status,
        totalSyncs: asanaLogs.length,
        successRate: (successCount / asanaLogs.length) * 100,
        totalRecordsSynced: totalRecords,
        avgDuration,
        lastError,
      });
    } else {
      summaries.push({
        integration: "Asana",
        lastSyncAt: null,
        lastSyncStatus: "never",
        totalSyncs: 0,
        successRate: 0,
        totalRecordsSynced: 0,
        avgDuration: null,
        lastError: null,
      });
    }

    // GA4 summary
    const { data: ga4Logs } = await supabase
      .from("ga4_sync_log")
      .select("*")
      .order("sync_started_at", { ascending: false });

    if (ga4Logs && ga4Logs.length > 0) {
      const lastSync = ga4Logs[0];
      const successCount = ga4Logs.filter((l: any) => l.status === "success").length;
      const totalRecords = ga4Logs.reduce((sum: number, l: any) => sum + (l.records_synced || 0), 0);
      const completedSyncs = ga4Logs.filter((l: any) => l.sync_completed_at);
      const avgDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum: number, l: any) => {
          const duration = (new Date(l.sync_completed_at).getTime() - new Date(l.sync_started_at).getTime()) / 1000;
          return sum + duration;
        }, 0) / completedSyncs.length
        : null;
      const lastError = ga4Logs.find((l: any) => l.errors && l.errors.length > 0)?.errors?.[0] || null;

      summaries.push({
        integration: "Google Analytics",
        lastSyncAt: lastSync.sync_completed_at || lastSync.sync_started_at,
        lastSyncStatus: lastSync.status,
        totalSyncs: ga4Logs.length,
        successRate: (successCount / ga4Logs.length) * 100,
        totalRecordsSynced: totalRecords,
        avgDuration,
        lastError,
      });
    } else {
      summaries.push({
        integration: "Google Analytics",
        lastSyncAt: null,
        lastSyncStatus: "never",
        totalSyncs: 0,
        successRate: 0,
        totalRecordsSynced: 0,
        avgDuration: null,
        lastError: null,
      });
    }

    // GSC summary
    const { data: gscLogs } = await supabase
      .from("gsc_sync_log")
      .select("*")
      .order("sync_started_at", { ascending: false });

    if (gscLogs && gscLogs.length > 0) {
      const lastSync = gscLogs[0];
      const successCount = gscLogs.filter((l: any) => l.status === "success").length;
      const totalRecords = gscLogs.reduce((sum: number, l: any) => sum + (l.records_synced || 0), 0);
      const completedSyncs = gscLogs.filter((l: any) => l.sync_completed_at);
      const avgDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum: number, l: any) => {
          const duration = (new Date(l.sync_completed_at).getTime() - new Date(l.sync_started_at).getTime()) / 1000;
          return sum + duration;
        }, 0) / completedSyncs.length
        : null;
      const lastError = gscLogs.find((l: any) => l.errors)?.errors || null;

      summaries.push({
        integration: "Google Search Console",
        lastSyncAt: lastSync.sync_completed_at || lastSync.sync_started_at,
        lastSyncStatus: lastSync.status,
        totalSyncs: gscLogs.length,
        successRate: (successCount / gscLogs.length) * 100,
        totalRecordsSynced: totalRecords,
        avgDuration,
        lastError,
      });
    } else {
      summaries.push({
        integration: "Google Search Console",
        lastSyncAt: null,
        lastSyncStatus: "never",
        totalSyncs: 0,
        successRate: 0,
        totalRecordsSynced: 0,
        avgDuration: null,
        lastError: null,
      });
    }

    // Add placeholder summaries for integrations without sync logs yet
    const placeholderIntegrations = ["Shopify", "Klaviyo", "Attentive", "Google Merchant Center"];
    placeholderIntegrations.forEach(name => {
      summaries.push({
        integration: name,
        lastSyncAt: null,
        lastSyncStatus: "never",
        totalSyncs: 0,
        successRate: 0,
        totalRecordsSynced: 0,
        avgDuration: null,
        lastError: null,
      });
    });

    return {
      data: summaries,
      source: "supabase",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching sync summaries:", error);
    return { data: [] };
  }
}
