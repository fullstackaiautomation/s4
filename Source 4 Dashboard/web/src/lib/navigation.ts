export const NAV_SECTIONS = [
  {
    title: "Dashboards",
    items: [
      { title: "Overview", href: "/dashboards/overview", status: "active" as const },
      { title: "Sales", href: "/dashboards/sales", status: "active" as const },
      { title: "Reps", href: "/dashboards/reps", status: "active" as const },
      { title: "Product Ad Spend", href: "/dashboards/product-ad-spend", status: "active" as const },
      { title: "Home Runs", href: "/dashboards/home-runs", status: "active" as const },
    ],
  },
  {
    title: "Sales",
    items: [
      { title: "Quotes", href: "/sales/quotes", status: "active" as const },
      { title: "Abandoned Carts", href: "/sales/abandoned-carts", status: "active" as const },
    ],
  },
  {
    title: "Marketing",
    items: [
      { title: "Blog", href: "/marketing/blog", status: "active" as const },
      { title: "Email", href: "/marketing/email", status: "active" as const },
      { title: "SMS", href: "/marketing/sms", status: "active" as const },
      { title: "SEO", href: "/marketing/seo", status: "active" as const },
      { title: "Google & Bing Ads", href: "/marketing/google-bing-ads", status: "active" as const },
    ],
  },
  {
    title: "Uploads",
    items: [
      { title: "Monthly Dashboard", href: "/uploads/monthly-dashboard", status: "active" as const },
      { title: "Reviews", href: "/uploads/reviews", status: "active" as const },
    ],
  },
  {
    title: "Automations",
    items: [
      { title: "Dashboard", href: "/automations/dashboard", status: "active" as const },
      { title: "Projects", href: "/automations/projects", status: "active" as const },
    ],
  },
  {
    title: "Admin",
    items: [
      { title: "SKU Master", href: "/admin/sku-master", status: "active" as const },
      { title: "Logins", href: "/admin/logins", status: "active" as const },
      { title: "Branding", href: "/admin/branding", status: "future" as const },
    ],
  },
];
