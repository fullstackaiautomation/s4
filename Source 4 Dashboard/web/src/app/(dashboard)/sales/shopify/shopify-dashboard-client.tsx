"use client";

import { useMemo } from "react";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ShopifyDailySales,
  ShopifyOrder,
  ShopifyProductSales,
  ShopifyCustomer,
  ApiResponse,
} from "@/lib/data-service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface ShopifyDashboardClientProps {
  dailySales: ApiResponse<ShopifyDailySales[]> & { refreshedAt: string };
  recentOrders: ApiResponse<ShopifyOrder[]> & { refreshedAt: string };
  topProducts: ApiResponse<ShopifyProductSales[]> & { refreshedAt: string };
  topCustomers: ApiResponse<ShopifyCustomer[]> & { refreshedAt: string };
  summaryStats: ApiResponse<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    averageOrderValue: number;
  }> & { refreshedAt: string };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ShopifyDashboardClient({
  dailySales,
  recentOrders,
  topProducts,
  topCustomers,
  summaryStats,
}: ShopifyDashboardClientProps) {
  // Calculate 30-day and 7-day totals for comparison
  const { last30Days, last7Days, previousPeriod } = useMemo(() => {
    const sorted = [...dailySales.data].sort((a, b) => b.date.localeCompare(a.date));
    const last30 = sorted.slice(0, 30);
    const last7 = sorted.slice(0, 7);
    const prev30 = sorted.slice(30, 60);

    const sumSales = (arr: ShopifyDailySales[]) =>
      arr.reduce((sum, d) => sum + d.totalSales, 0);
    const sumOrders = (arr: ShopifyDailySales[]) =>
      arr.reduce((sum, d) => sum + d.ordersCount, 0);

    return {
      last30Days: {
        sales: sumSales(last30),
        orders: sumOrders(last30),
      },
      last7Days: {
        sales: sumSales(last7),
        orders: sumOrders(last7),
      },
      previousPeriod: {
        sales: sumSales(prev30),
        orders: sumOrders(prev30),
      },
    };
  }, [dailySales.data]);

  // Calculate growth percentages
  const salesGrowth = previousPeriod.sales > 0
    ? ((last30Days.sales - previousPeriod.sales) / previousPeriod.sales) * 100
    : 0;
  const ordersGrowth = previousPeriod.orders > 0
    ? ((last30Days.orders - previousPeriod.orders) / previousPeriod.orders) * 100
    : 0;

  // Prepare chart data (last 30 days)
  const chartData = useMemo(() => {
    const sorted = [...dailySales.data]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    return sorted.map((day) => ({
      date: formatDate(day.date),
      sales: day.totalSales,
      orders: day.ordersCount,
    }));
  }, [dailySales.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopify Sales</h1>
          <p className="text-muted-foreground">
            E-commerce performance from your Shopify store
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last synced: {new Date(summaryStats.refreshedAt).toLocaleString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Total Revenue (30d)
            </div>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {formatCurrency(last30Days.sales)}
            </div>
            {salesGrowth !== 0 && (
              <div
                className={`flex items-center text-xs ${
                  salesGrowth > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {salesGrowth > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(salesGrowth).toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Orders (30d)
            </div>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {formatNumber(last30Days.orders)}
            </div>
            {ordersGrowth !== 0 && (
              <div
                className={`flex items-center text-xs ${
                  ordersGrowth > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {ordersGrowth > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(ordersGrowth).toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Avg Order Value
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.data.averageOrderValue)}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Total Customers
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {formatNumber(summaryStats.data.totalCustomers)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">Sales Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Trend */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">Orders (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [value, "Orders"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Top Products by Revenue</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {topProducts.data.slice(0, 10).map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="truncate max-w-[200px]">
                    {product.productTitle}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-muted-foreground">
                    {formatNumber(product.unitsSold)} units
                  </span>
                  <span className="font-medium">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </div>
              </div>
            ))}
            {topProducts.data.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No product sales data available
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Top Customers</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {topCustomers.data.slice(0, 10).map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="truncate max-w-[200px]">
                    {customer.firstName} {customer.lastName}
                    {!customer.firstName && !customer.lastName && (
                      <span className="text-muted-foreground">
                        {customer.email || "Anonymous"}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-muted-foreground">
                    {customer.ordersCount} orders
                  </span>
                  <span className="font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              </div>
            ))}
            {topCustomers.data.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No customer data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recent Orders</h3>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 text-left font-medium">Order</th>
                <th className="py-2 text-left font-medium">Customer</th>
                <th className="py-2 text-left font-medium">Date</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.data.slice(0, 15).map((order) => (
                <tr key={order.orderId} className="border-b last:border-0">
                  <td className="py-2 font-medium">{order.name}</td>
                  <td className="py-2">
                    {order.customerFirstName} {order.customerLastName}
                    {!order.customerFirstName && !order.customerLastName && (
                      <span className="text-muted-foreground">Guest</span>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.financialStatus === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : order.financialStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {order.financialStatus}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(order.totalPrice)}
                  </td>
                </tr>
              ))}
              {recentOrders.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No orders found. Run a Shopify sync to load data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
