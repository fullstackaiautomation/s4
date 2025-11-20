"use client";

import { useMemo, useState } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Trophy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useDashboardFilters } from "@/components/providers/dashboard-filters";
import type { TimeRange } from "@/components/providers/dashboard-filters";

export type TopProduct = {
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
  trend_2025: number | null;
};

type Dataset = {
  data: TopProduct[];
  error?: string;
  refreshedAt?: string;
};

type TopProductsClientProps = {
  datasets: Partial<Record<TimeRange, Dataset>> & { all: Dataset };
};

export function TopProductsClient({ datasets }: TopProductsClientProps) {
  const { timeRange, vendor: selectedVendor } = useDashboardFilters();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "roi" | "profit">("revenue");

  const activeDataset = datasets[timeRange] ?? datasets.all;
  const products = useMemo(() => activeDataset?.data ?? [], [activeDataset]);
  const error = activeDataset?.error ?? null;

  // No vendor filtering - show all products
  const productsByVendor = useMemo(() => {
    return products;
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(productsByVendor.map((product) => product.overall_product_category))).filter(Boolean);
  }, [productsByVendor]);

  // No category filtering - show all products, just sort them
  const filteredProducts = useMemo(() => {
    return productsByVendor
      .sort((a, b) => {
        switch (sortBy) {
          case "orders":
            return b.total_orders - a.total_orders;
          case "roi":
            return b.avg_roi - a.avg_roi;
          case "profit":
            return b.total_profit - a.total_profit;
          case "revenue":
          default:
            return b.total_revenue - a.total_revenue;
        }
      });
  }, [productsByVendor, sortBy]);

  const totalRevenue = filteredProducts.reduce((sum, product) => sum + product.total_revenue, 0);
  const totalProfit = filteredProducts.reduce((sum, product) => sum + product.total_profit, 0);
  const totalOrders = filteredProducts.reduce((sum, product) => sum + product.total_orders, 0);
  const avgROI = filteredProducts.length
    ? filteredProducts.reduce((sum, product) => sum + product.avg_roi, 0) / filteredProducts.length
    : 0;

  // Top 3 by different metrics
  const topByRevenue = [...filteredProducts].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 3);
  const topByOrders = [...filteredProducts].sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);
  const topByProfit = [...filteredProducts].sort((a, b) => b.total_profit - a.total_profit).slice(0, 3);

  if (!products.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No product performance data available for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Top Products</h1>
          <p className="mt-1 text-muted-foreground">Complete product performance analysis across all sales data.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="rounded-lg border bg-card px-3 py-2"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="orders">Sort by Orders</option>
            <option value="roi">Sort by ROI</option>
            <option value="profit">Sort by Profit</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold">${Math.round(totalRevenue).toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="mt-1 text-2xl font-bold">${Math.round(totalProfit).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-2xl font-bold">{Math.round(totalOrders).toLocaleString()}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average ROI</p>
              <p className="mt-1 text-2xl font-bold">{(avgROI * 100).toFixed(1)}%</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top 3 by Orders */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Top Order Quantities
              </h3>
              {topByOrders.map((product, index) => (
                <div key={`orders-${product.sku}`} className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-card to-muted/20 p-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{product.description}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{Math.round(product.total_sales).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">qty</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 3 by Revenue */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Top Revenue Generators
              </h3>
              {topByRevenue.map((product, index) => (
                <div key={`revenue-${product.sku}`} className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-card to-muted/20 p-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{product.description}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${Math.round(product.total_revenue / 1000)}k</p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 3 by Profit */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Profit Generators
              </h3>
              {topByProfit.map((product, index) => (
                <div key={`profit-${product.sku}`} className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-card to-muted/20 p-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{product.description}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${Math.round(product.total_profit / 1000)}k</p>
                    <p className="text-xs text-muted-foreground">profit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            All Products ({filteredProducts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-16 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="w-80 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="w-44 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Vendor</th>
                <th className="w-56 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Orders</th>
                <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</th>
                <th className="w-32 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit</th>
                <th className="w-20 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI</th>
                <th className="w-28 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Price</th>
                <th className="w-20 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">2025 Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product, index) => (
                <tr key={product.sku} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-4 text-sm">
                    <span className="font-semibold">#{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{product.description}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{product.vendor}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {product.product_category || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">{Math.round(product.total_orders).toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-sm">{Math.round(product.total_sales).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">${Math.round(product.total_revenue).toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-sm text-green-600">${Math.round(product.total_profit).toLocaleString()}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {product.avg_roi > 0.35 ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : product.avg_roi < 0.2 ? (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span
                        className={`text-sm font-semibold ${
                          product.avg_roi > 0.35 ? "text-green-500" : product.avg_roi < 0.2 ? "text-red-500" : ""
                        }`}
                      >
                        {(product.avg_roi * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm">${product.avg_price.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">
                    {product.trend_2025 !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {product.trend_2025 > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-500" />
                        ) : product.trend_2025 < 0 ? (
                          <ArrowDown className="h-3 w-3 text-red-500" />
                        ) : null}
                        <span
                          className={`text-sm font-semibold ${
                            product.trend_2025 > 0 ? "text-green-500" : product.trend_2025 < 0 ? "text-red-500" : ""
                          }`}
                        >
                          {product.trend_2025 > 0 ? "+" : ""}{(product.trend_2025 * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeDataset?.refreshedAt && (
        <p className="text-xs text-muted-foreground">
          Updated {new Date(activeDataset.refreshedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
