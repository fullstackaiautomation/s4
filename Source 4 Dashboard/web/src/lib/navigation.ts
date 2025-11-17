import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Trophy,
  FileText,
  ShoppingCart,
  Megaphone,
  BookOpen,
  Mail,
  MessageSquare,
  Search,
  MousePointer2,
  FileUp,
  Star,
  Zap,
  FolderKanban,
  Settings,
  Package,
  KeyRound,
  Palette,
  LucideIcon
} from "lucide-react";

import { Role, coerceRole, minimumRoleForPath, roleMeetsMinimum } from "@/lib/auth/roles";

export type NavItem = {
  title: string;
  href: string;
  status: "active" | "future" | "beta";
  icon?: LucideIcon;
  badge?: string;
  minRole?: Role;
};

export type NavSection = {
  title: string;
  icon?: LucideIcon;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Sales",
    icon: ShoppingCart,
    items: [
      {
        title: "Sales Overview",
        href: "/dashboards/sales",
        status: "active",
        icon: TrendingUp,
        minRole: "employee",
      },
      {
        title: "Rep Performance",
        href: "/dashboards/reps",
        status: "active",
        icon: Users,
        minRole: "employee",
      },
      {
        title: "Vendor Performance",
        href: "/dashboards/vendors",
        status: "future",
        icon: Package,
        minRole: "employee",
      },
      {
        title: "Home Runs",
        href: "/dashboards/home-runs",
        status: "active",
        icon: Trophy,
        minRole: "employee",
      },
      {
        title: "Top Products",
        href: "/dashboards/top-products",
        status: "active",
        icon: Star,
        minRole: "employee",
      },
      {
        title: "Quotes",
        href: "/sales/quotes",
        status: "active",
        icon: FileText,
        minRole: "employee",
      },
      {
        title: "Abandoned Carts",
        href: "/sales/abandoned-carts",
        status: "active",
        icon: ShoppingCart,
        badge: "12",
        minRole: "employee",
      },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      {
        title: "Product Ad Spend",
        href: "/dashboards/product-ad-spend",
        status: "active",
        icon: DollarSign,
        minRole: "employee",
      },
      {
        title: "Google Ads",
        href: "/marketing/google-ads",
        status: "future",
        icon: MousePointer2,
        minRole: "employee",
      },
      {
        title: "Bing Ads",
        href: "/marketing/bing-ads",
        status: "future",
        icon: MousePointer2,
        minRole: "employee",
      },
      {
        title: "SEO",
        href: "/marketing/seo",
        status: "active",
        icon: Search,
        minRole: "employee",
      },
      {
        title: "Email",
        href: "/marketing/email",
        status: "active",
        icon: Mail,
        minRole: "employee",
      },
      {
        title: "SMS",
        href: "/marketing/sms",
        status: "active",
        icon: MessageSquare,
        minRole: "employee",
      },
      {
        title: "Blog",
        href: "/marketing/blog",
        status: "active",
        icon: BookOpen,
        minRole: "employee",
      },
      {
        title: "Reviews",
        href: "/uploads/reviews",
        status: "active",
        icon: Star,
        minRole: "admin",
      },
    ],
  },
  {
    title: "Automations",
    icon: Zap,
    items: [
      {
        title: "Dashboard",
        href: "/automations/dashboard",
        status: "active",
        icon: LayoutDashboard,
        minRole: "admin",
      },
      {
        title: "Automations",
        href: "/automations/projects",
        status: "active",
        icon: FolderKanban,
        minRole: "admin",
      },
      {
        title: "Monthly Reports",
        href: "/uploads/monthly-dashboard",
        status: "active",
        icon: FileUp,
        minRole: "admin",
      },
      {
        title: "SKU Master",
        href: "/admin/sku-master",
        status: "active",
        icon: Package,
        minRole: "admin",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "Access Control",
        href: "/admin/logins",
        status: "active",
        icon: KeyRound,
        minRole: "owner",
      },
      {
        title: "Branding",
        href: "/admin/branding",
        status: "future",
        icon: Palette,
        minRole: "owner",
      },
    ],
  },
];

export function getNavSectionsForRole(roleInput: unknown): NavSection[] {
  const role = coerceRole(roleInput);
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => item.status !== "future")
      .filter((item) => {
        const minRole = item.minRole ?? minimumRoleForPath(item.href) ?? "employee";
        return roleMeetsMinimum(role, minRole);
      }),
  })).filter((section) => section.items.length > 0);
}