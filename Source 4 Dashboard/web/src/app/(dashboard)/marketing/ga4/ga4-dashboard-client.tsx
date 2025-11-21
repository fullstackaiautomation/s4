"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Users, MousePointer, Eye, ShoppingCart, Clock } from "lucide-react";

// Date range filter types and options
type DateRangeOption = "this-year" | "last-year" | "this-month" | "last-month" | "all-time";

const DATE_RANGE_OPTIONS: { label: string; value: DateRangeOption }[] = [
  { label: "This Year", value: "this-year" },
  { label: "Last Year", value: "last-year" },
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "All Time", value: "all-time" },
];

function getDateRange(option: DateRangeOption): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (option) {
    case "this-year":
      return {
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31, 23, 59, 59, 999),
      };
    case "last-year":
      return {
        start: new Date(currentYear - 1, 0, 1),
        end: new Date(currentYear - 1, 11, 31, 23, 59, 59, 999),
      };
    case "this-month":
      return {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      };
    case "last-month":
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return {
        start: new Date(lastMonthYear, lastMonth, 1),
        end: new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999),
      };
    case "all-time":
    default:
      return {
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31, 23, 59, 59, 999),
      };
  }
}

import { SectionHeader } from "@/components/section-header";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type {
  getGA4DailyTraffic,
  getGA4TrafficSources,
  getGA4PagePerformance,
  getGA4Conversions,
  getGA4EcommerceTransactions,
} from "@/lib/data-service";

type DailyTrafficResult = Awaited<ReturnType<typeof getGA4DailyTraffic>>;
type TrafficSourcesResult = Awaited<ReturnType<typeof getGA4TrafficSources>>;
type PagePerformanceResult = Awaited<ReturnType<typeof getGA4PagePerformance>>;
type ConversionsResult = Awaited<ReturnType<typeof getGA4Conversions>>;
type EcommerceTransactionsResult = Awaited<ReturnType<typeof getGA4EcommerceTransactions>>;

type GA4DashboardClientProps = {
  dailyTraffic: DailyTrafficResult;
  trafficSources: TrafficSourcesResult;
  pagePerformance: PagePerformanceResult;
  conversions: ConversionsResult;
  ecommerceTransactions: EcommerceTransactionsResult;
};

export function GA4DashboardClient({
  dailyTraffic,
  trafficSources,
  pagePerformance,
  conversions,
  ecommerceTransactions,
}: GA4DashboardClientProps) {
  // Date range filter state
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("this-month");

  // Filter data by date range
  const filteredDailyTraffic = useMemo(() => {
    const range = getDateRange(dateRangeOption);
    return dailyTraffic.data.filter((row) => {
      const rowDate = new Date(row.date);
      return rowDate >= range.start && rowDate <= range.end;
    });
  }, [dailyTraffic.data, dateRangeOption]);

  const filteredTrafficSources = useMemo(() => {
    const range = getDateRange(dateRangeOption);
    return trafficSources.data.filter((row) => {
      const rowDate = new Date(row.date);
      return rowDate >= range.start && rowDate <= range.end;
    });
  }, [trafficSources.data, dateRangeOption]);

  const filteredConversions = useMemo(() => {
    const range = getDateRange(dateRangeOption);
    return conversions.data.filter((row) => {
      const rowDate = new Date(row.date);
      return rowDate >= range.start && rowDate <= range.end;
    });
  }, [conversions.data, dateRangeOption]);

  const filteredEcommerceTransactions = useMemo(() => {
    const range = getDateRange(dateRangeOption);
    return ecommerceTransactions.data.filter((row) => {
      const rowDate = new Date(row.date);
      return rowDate >= range.start && rowDate <= range.end;
    });
  }, [ecommerceTransactions.data, dateRangeOption]);

  const filteredPagePerformance = useMemo(() => {
    const range = getDateRange(dateRangeOption);
    return pagePerformance.data.filter((row) => {
      const rowDate = new Date(row.date);
      return rowDate >= range.start && rowDate <= range.end;
    });
  }, [pagePerformance.data, dateRangeOption]);

  // Calculate totals from filtered daily traffic (sum all days in range)
  const latestMetrics = useMemo(() => {
    if (filteredDailyTraffic.length === 0) {
      return {
        sessions: 0,
        users: 0,
        newUsers: 0,
        engagementRate: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pageviews: 0,
      };
    }

    // Sum all metrics across the filtered date range
    const totals = filteredDailyTraffic.reduce(
      (acc, row) => ({
        sessions: acc.sessions + row.sessions,
        users: acc.users + row.users,
        newUsers: acc.newUsers + row.newUsers,
        engagementRateSum: acc.engagementRateSum + row.engagementRate,
        bounceRateSum: acc.bounceRateSum + row.bounceRate,
        avgSessionDurationSum: acc.avgSessionDurationSum + row.averageSessionDuration,
        pageviews: acc.pageviews + row.pageviews,
        count: acc.count + 1,
      }),
      {
        sessions: 0,
        users: 0,
        newUsers: 0,
        engagementRateSum: 0,
        bounceRateSum: 0,
        avgSessionDurationSum: 0,
        pageviews: 0,
        count: 0,
      }
    );

    return {
      sessions: totals.sessions,
      users: totals.users,
      newUsers: totals.newUsers,
      engagementRate: totals.count > 0 ? totals.engagementRateSum / totals.count : 0,
      bounceRate: totals.count > 0 ? totals.bounceRateSum / totals.count : 0,
      avgSessionDuration: totals.count > 0 ? totals.avgSessionDurationSum / totals.count : 0,
      pageviews: totals.pageviews,
    };
  }, [filteredDailyTraffic]);

  // Calculate total conversions and revenue
  const conversionMetrics = useMemo(() => {
    const purchaseConversions = filteredConversions.filter((c) => c.conversionEvent === "purchase");
    const totalConversions = purchaseConversions.reduce((sum, c) => sum + c.conversions, 0);
    const totalRevenue = purchaseConversions.reduce((sum, c) => sum + c.conversionValue, 0);

    return {
      totalConversions,
      totalRevenue,
    };
  }, [filteredConversions]);

  // Aggregate traffic sources by source
  const sourceAggregates = useMemo(() => {
    const aggregates = new Map<
      string,
      {
        source: string;
        sessions: number;
        users: number;
        conversions: number;
        revenue: number;
      }
    >();

    filteredTrafficSources.forEach((row) => {
      const key = row.source;
      const existing = aggregates.get(key) ?? {
        source: key,
        sessions: 0,
        users: 0,
        conversions: 0,
        revenue: 0,
      };

      existing.sessions += row.sessions;
      existing.users += row.users;
      existing.conversions += row.conversions;
      existing.revenue += row.revenue;

      aggregates.set(key, existing);
    });

    return Array.from(aggregates.values()).sort((a, b) => b.sessions - a.sessions);
  }, [filteredTrafficSources]);

  // Aggregate conversions by source for attribution
  const conversionsBySource = useMemo(() => {
    const aggregates = new Map<
      string,
      {
        source: string;
        conversions: number;
        revenue: number;
        events: number;
      }
    >();

    filteredConversions.forEach((row) => {
      const key = row.source || "(not set)";
      const existing = aggregates.get(key) ?? {
        source: key,
        conversions: 0,
        revenue: 0,
        events: 0,
      };

      existing.conversions += row.conversions;
      existing.revenue += row.conversionValue;
      existing.events += 1;

      aggregates.set(key, existing);
    });

    return Array.from(aggregates.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredConversions]);

  // Prepare chart data for daily revenue trend
  const trafficChartData = useMemo(() => {
    // Create a map of date -> revenue/conversions
    const dailyRevenue = new Map<string, number>();
    const dailyConversions = new Map<string, number>();

    filteredConversions.forEach(row => {
      const dateKey = row.date; // YYYY-MM-DD
      const currentRev = dailyRevenue.get(dateKey) || 0;
      const currentConv = dailyConversions.get(dateKey) || 0;

      dailyRevenue.set(dateKey, currentRev + row.conversionValue);
      dailyConversions.set(dateKey, currentConv + row.conversions);
    });

    return filteredDailyTraffic
      .slice()
      .reverse()
      .map((row) => {
        const revenue = dailyRevenue.get(row.date) || 0;
        const conversions = dailyConversions.get(row.date) || 0;

        return {
          date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          Revenue: revenue,
          Conversions: conversions,
        };
      });
  }, [filteredDailyTraffic, filteredConversions]);

  // Format session duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Google Analytics 4"
          description="Website traffic, conversions, and e-commerce performance"
        />
        <div className="flex items-center gap-2">
          <select
            value={dateRangeOption}
            onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="Sessions"
          value={formatNumber(latestMetrics.sessions)}
          icon={<MousePointer className="h-5 w-5" />}
        />
        <MetricTile
          label="Users"
          value={formatNumber(latestMetrics.users)}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricTile
          label="Pageviews"
          value={formatNumber(latestMetrics.pageviews)}
          icon={<Eye className="h-5 w-5" />}
        />
        <MetricTile
          label="Engagement Rate"
          value={formatPercent(latestMetrics.engagementRate / 100)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="New Users"
          value={formatNumber(latestMetrics.newUsers)}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricTile
          label="Avg Session Duration"
          value={formatDuration(latestMetrics.avgSessionDuration)}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricTile
          label="Conversions"
          value={formatNumber(conversionMetrics.totalConversions)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <MetricTile
          label="Conversion Revenue"
          value={formatCurrency(conversionMetrics.totalRevenue)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      {/* Traffic Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Revenue and conversions over time</CardDescription>
        </CardHeader>
        <div className="p-6" style={{ minHeight: '400px' }}>
          <TrafficChart
            data={trafficChartData}
            xKey="date"
            yKeys={["Revenue", "Conversions"]}
            colors={["#10b981", "#3b82f6"]}
          />
        </div>
      </Card>

      {/* Conversions by Source - Attribution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Attribution by Source</CardTitle>
          <CardDescription>Conversions and revenue broken down by traffic source (Google, Bing, Direct, etc.)</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Avg Value</TableHeadCell>
                <TableHeadCell className="text-right">% of Total</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversionsBySource.map((row, idx) => {
                const totalRevenue = conversionsBySource.reduce((sum, r) => sum + r.revenue, 0);
                const percentage = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                const avgValue = row.conversions > 0 ? row.revenue / row.conversions : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(avgValue)}</TableCell>
                    <TableCell className="text-right">{formatPercent(percentage / 100)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Traffic Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Top traffic sources by sessions</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell className="text-right">Sessions</TableHeadCell>
                <TableHeadCell className="text-right">Users</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">Revenue</TableHeadCell>
                <TableHeadCell className="text-right">Conv. Rate</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceAggregates.slice(0, 10).map((row, idx) => {
                const convRate = row.sessions > 0 ? (row.conversions / row.sessions) * 100 : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.sessions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.users)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="text-right">{formatPercent(convRate / 100)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Best performing pages by pageviews</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Page Path</TableHeadCell>
                <TableHeadCell>Page Title</TableHeadCell>
                <TableHeadCell className="text-right">Pageviews</TableHeadCell>
                <TableHeadCell className="text-right">Unique Views</TableHeadCell>
                <TableHeadCell className="text-right">Avg Time (s)</TableHeadCell>
                <TableHeadCell className="text-right">Bounce Rate</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPagePerformance.slice(0, 10).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{row.pagePath}</TableCell>
                  <TableCell>{row.pageTitle}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.pageviews)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.uniquePageviews)}</TableCell>
                  <TableCell className="text-right">{Math.round(row.avgTimeOnPage)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.bounceRate / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Conversions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Events</CardTitle>
          <CardDescription>Key conversion events and their performance</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Event</TableHeadCell>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell>Medium</TableHeadCell>
                <TableHeadCell className="text-right">Conversions</TableHeadCell>
                <TableHeadCell className="text-right">Value</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversions.slice(0, 10).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.conversionEvent}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.medium}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.conversionValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* E-commerce Transactions */}
      {filteredEcommerceTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest e-commerce transactions</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadCell>Transaction ID</TableHeadCell>
                  <TableHeadCell>Source</TableHeadCell>
                  <TableHeadCell>Medium</TableHeadCell>
                  <TableHeadCell className="text-right">Revenue</TableHeadCell>
                  <TableHeadCell className="text-right">Tax</TableHeadCell>
                  <TableHeadCell className="text-right">Shipping</TableHeadCell>
                  <TableHeadCell className="text-right">Items</TableHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEcommerceTransactions.slice(0, 10).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{row.transactionId}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.medium}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.tax)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.shipping)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.itemsPurchased)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
