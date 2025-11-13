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

  const productsByVendor = useMemo(() => {
    if (!selectedVendor) return products;
    return products.filter((product) => product.vendor === selectedVendor);
  }, [products, selectedVendor]);

  const categories = useMemo(() => {
    return Array.from(new Set(productsByVendor.map((product) => product.overall_product_category))).filter(Boolean);
  }, [productsByVendor]);

  const filteredProducts = useMemo(() => {
    return productsByVendor
      .filter((product) => selectedCategory === "all" || product.overall_product_category === selectedCategory)
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
  }, [productsByVendor, selectedCategory, sortBy]);

  const totalRevenue = filteredProducts.reduce((sum, product) => sum + product.total_revenue, 0);
  const totalProfit = filteredProducts.reduce((sum, product) => sum + product.total_profit, 0);
  const totalOrders = filteredProducts.reduce((sum, product) => sum + product.total_orders, 0);
  const avgROI = filteredProducts.length
    ? filteredProducts.reduce((sum, product) => sum + product.avg_roi, 0) / filteredProducts.length
    : 0;

  const topThree = filteredProducts.slice(0, 3);

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
          <p className="mt-1 text-muted-foreground">Performance analysis based on filter-adjusted sales data.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-lg border bg-card px-3 py-2"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
              <p className="mt-1 text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="mt-1 text-2xl font-bold">${totalProfit.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-2xl font-bold">{totalOrders.toLocaleString()}</p>
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

      {topThree.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {topThree.map((product, index) => (
              <div key={product.sku} className="rounded-lg border bg-gradient-to-br from-card to-muted/20 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                </div>
                <h3 className="mb-2 line-clamp-2 text-sm font-medium">{product.description}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold">${product.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI</span>
                    <span className="font-semibold text-green-500">{(product.avg_roi * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.slice(0, 20).map((product, index) => (
                <tr key={product.sku} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4 text-sm">
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
                  <td className="px-6 py-4 text-right text-sm font-medium">${product.total_revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">${product.total_profit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm">{product.total_orders.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm">${product.avg_price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
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
