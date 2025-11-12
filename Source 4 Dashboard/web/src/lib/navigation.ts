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
  Upload,
  FileUp,
  Star,
  Zap,
  FolderKanban,
  Settings,
  Package,
  KeyRound,
  Palette,
  LucideIcon
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  status: "active" | "future" | "beta";
  icon?: LucideIcon;
  badge?: string;
};

export type NavSection = {
  title: string;
  icon?: LucideIcon;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Analytics",
    icon: LayoutDashboard,
    items: [
      {
        title: "Sales Overview",
        href: "/dashboards/sales",
        status: "active",
        icon: TrendingUp
      },
      {
        title: "Rep Performance",
        href: "/dashboards/reps",
        status: "active",
        icon: Users
      },
      {
        title: "Ad Spend",
        href: "/dashboards/product-ad-spend",
        status: "active",
        icon: DollarSign,
        badge: "New"
      },
      {
        title: "Top Products",
        href: "/dashboards/top-products",
        status: "active",
        icon: Trophy,
        badge: "Live"
      },
      {
        title: "Home Run Orders",
        href: "/dashboards/home-runs",
        status: "active",
        icon: Package
      },
    ],
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    items: [
      {
        title: "Quotes",
        href: "/sales/quotes",
        status: "active",
        icon: FileText
      },
      {
        title: "Abandoned Carts",
        href: "/sales/abandoned-carts",
        status: "active",
        icon: ShoppingCart,
        badge: "12"
      },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      {
        title: "Blog",
        href: "/marketing/blog",
        status: "active",
        icon: BookOpen
      },
      {
        title: "Email Campaigns",
        href: "/marketing/email",
        status: "active",
        icon: Mail
      },
      {
        title: "SMS",
        href: "/marketing/sms",
        status: "active",
        icon: MessageSquare
      },
      {
        title: "SEO",
        href: "/marketing/seo",
        status: "active",
        icon: Search
      },
      {
        title: "Paid Ads",
        href: "/marketing/google-bing-ads",
        status: "active",
        icon: MousePointer2
      },
    ],
  },
  {
    title: "Data Management",
    icon: Upload,
    items: [
      {
        title: "Monthly Reports",
        href: "/uploads/monthly-dashboard",
        status: "active",
        icon: FileUp
      },
      {
        title: "Reviews",
        href: "/uploads/reviews",
        status: "active",
        icon: Star
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
        icon: LayoutDashboard
      },
      {
        title: "Projects",
        href: "/automations/projects",
        status: "active",
        icon: FolderKanban
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "SKU Master",
        href: "/admin/sku-master",
        status: "active",
        icon: Package
      },
      {
        title: "Access Control",
        href: "/admin/logins",
        status: "active",
        icon: KeyRound
      },
      {
        title: "Branding",
        href: "/admin/branding",
        status: "future",
        icon: Palette
      },
    ],
  },
];