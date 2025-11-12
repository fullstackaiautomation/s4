"use client";

import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Trophy,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { getTopProducts } from "@/lib/data-service";

type Product = {
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

export default function TopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "roi" | "profit">("revenue");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getTopProducts(50);
      if (response.error) {
        setError(response.error);
      } else {
        setProducts(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(
    new Set(products.map(p => p.overall_product_category))
  ).filter(Boolean);

  // Filter and sort products
  const filteredProducts = products
    .filter(p => selectedCategory === "all" || p.overall_product_category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.total_revenue - a.total_revenue;
        case "orders":
          return b.total_orders - a.total_orders;
        case "roi":
          return b.avg_roi - a.avg_roi;
        case "profit":
          return b.total_profit - a.total_profit;
        default:
          return 0;
      }
    });

  // Calculate summary metrics
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalProfit = filteredProducts.reduce((sum, p) => sum + p.total_profit, 0);
  const totalOrders = filteredProducts.reduce((sum, p) => sum + p.total_orders, 0);
  const avgROI = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + p.avg_roi, 0) / filteredProducts.length
    : 0;

  // Get top 3 products by revenue
  const topThree = filteredProducts.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading top products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={loadProducts}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Top Products</h1>
          <p className="text-muted-foreground mt-1">
            Performance analysis based on all-time sales data
          </p>
        </div>
        <div className="flex gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-card"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "revenue" | "orders" | "roi" | "profit")}
            className="px-3 py-2 border rounded-lg bg-card"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="orders">Sort by Orders</option>
            <option value="roi">Sort by ROI</option>
            <option value="profit">Sort by Profit</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold mt-1">
                ${totalProfit.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">
                {totalOrders.toLocaleString()}
              </p>
            </div>
            <ShoppingBag className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average ROI</p>
              <p className="text-2xl font-bold mt-1">
                {(avgROI * 100).toFixed(1)}%
              </p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Top 3 Products Showcase */}
      {topThree.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((product, index) => (
              <div
                key={product.sku}
                className="rounded-lg border bg-gradient-to-br from-card to-muted/20 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                      ${index === 1 ? 'bg-gray-400 text-white' : ''}
                      ${index === 2 ? 'bg-orange-500 text-white' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-2">
                  {product.description}
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold">${product.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI</span>
                    <span className="font-semibold text-green-500">
                      {(product.avg_roi * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Products ({filteredProducts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.slice(0, 20).map((product, index) => (
                <tr
                  key={product.sku}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-semibold">#{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{product.description}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.vendor}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-muted">
                      {product.product_category || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${product.total_revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <span className="text-green-600">
                      ${product.total_profit.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {product.total_orders.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    ${product.avg_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {product.avg_roi > 0.35 ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : product.avg_roi < 0.2 ? (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-semibold ${
                        product.avg_roi > 0.35 ? 'text-green-500' :
                        product.avg_roi < 0.2 ? 'text-red-500' :
                        ''
                      }`}>
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
    </div>
  );
}