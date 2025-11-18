import {
  Gauge,
  TrendingUp,
  Users,
  Trophy,
  PackageSearch,
  ShoppingCart,
  DollarSign,
  LineChart,
} from "lucide-react";

import LandingDashboardClient from "./landing-dashboard-client";

const spotlight = {
  title: "Sales Overview",
  description: "Full revenue, profit, and order analytics across the business.",
  href: "/dashboards/sales",
  icon: TrendingUp,
  prefetch: true,
};

const sections = [
  {
    title: "Key Dashboards",
    description: "Jump into the most commonly used performance views.",
    links: [
      {
        title: "Sales Overview",
        description: "Best for executive snapshots and revenue pacing.",
        href: "/dashboards/sales",
        icon: TrendingUp,
        badge: "Core",
        prefetch: true,
      },
      {
        title: "Rep Performance",
        description: "Track rep-level revenue, orders, and win rates.",
        href: "/dashboards/reps",
        icon: Users,
        prefetch: true,
      },
      {
        title: "Home Runs",
        description: "See the biggest recent deals with margin context.",
        href: "/dashboards/home-runs",
        icon: Trophy,
        prefetch: true,
      },
      {
        title: "Top Products",
        description: "Find the products driving the highest revenue.",
        href: "/dashboards/top-products",
        icon: PackageSearch,
        prefetch: true,
      },
    ],
  },
  {
    title: "Operations & Marketing",
    description: "Access supporting workflows without loading heavy data upfront.",
    links: [
      {
        title: "Shopify Sales",
        description: "Monitor ecommerce performance synced from Shopify.",
        href: "/sales/shopify",
        icon: ShoppingCart,
        prefetch: true,
      },
      {
        title: "Quotes Pipeline",
        description: "Review open quotes and pipeline health synced from Asana.",
        href: "/sales/quotes",
        icon: DollarSign,
        prefetch: true,
      },
      {
        title: "Product Ad Spend",
        description: "Compare ad spend to attributed revenue and profit.",
        href: "/dashboards/product-ad-spend",
        icon: LineChart,
        prefetch: true,
      },
    ],
  },
  {
    title: "Quick Actions",
    description: "Keep momentum by jumping straight to operational tools.",
    links: [
      {
        title: "Abandoned Carts",
        description: "Recover stalled Shopify carts with contact follow-up.",
        href: "/sales/abandoned-carts",
        icon: ShoppingCart,
        prefetch: true,
      },
      {
        title: "Automations Dashboard",
        description: "Check on automation health and recent runs.",
        href: "/automations/dashboard",
        icon: Gauge,
        prefetch: false,
      },
    ],
  },
];

export default function LandingDashboard() {
  return <LandingDashboardClient spotlight={spotlight} sections={sections} />;
}
