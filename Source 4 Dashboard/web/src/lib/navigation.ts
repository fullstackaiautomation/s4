export const NAV_SECTIONS = [
  {
    title: "Dashboards",
    items: [
      { title: "Overview", href: "/s4/dashboards/overview", status: "active" as const },
      { title: "Sales", href: "/s4/dashboards/sales", status: "active" as const },
      { title: "Reps", href: "/s4/dashboards/reps", status: "active" as const },
      { title: "Product Ad Spend", href: "/s4/dashboards/product-ad-spend", status: "active" as const },
      { title: "Home Runs", href: "/s4/dashboards/home-runs", status: "active" as const },
    ],
  },
  {
    title: "Sales",
    items: [
      { title: "Quotes", href: "/s4/sales/quotes", status: "active" as const },
      { title: "Abandoned Carts", href: "/s4/sales/abandoned-carts", status: "active" as const },
    ],
  },
  {
    title: "Marketing",
    items: [
      { title: "Blog", href: "/s4/marketing/blog", status: "active" as const },
      { title: "Email", href: "/s4/marketing/email", status: "active" as const },
      { title: "SMS", href: "/s4/marketing/sms", status: "active" as const },
      { title: "SEO", href: "/s4/marketing/seo", status: "active" as const },
      { title: "Google & Bing Ads", href: "/s4/marketing/google-bing-ads", status: "active" as const },
    ],
  },
  {
    title: "Uploads",
    items: [
      { title: "Monthly Dashboard", href: "/s4/uploads/monthly-dashboard", status: "active" as const },
      { title: "Reviews", href: "/s4/uploads/reviews", status: "active" as const },
    ],
  },
  {
    title: "Automations",
    items: [
      { title: "Dashboard", href: "/s4/automations/dashboard", status: "active" as const },
      { title: "Projects", href: "/s4/automations/projects", status: "active" as const },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "SKU Master", href: "/s4/admin/sku-master", status: "active" as const },
      { title: "Logins", href: "/s4/admin/logins", status: "active" as const },
      { title: "Branding", href: "/s4/admin/branding", status: "future" as const },
    ],
  },
];
