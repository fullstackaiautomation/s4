# Source 4 Dashboard - Development Guide

## Project Overview
Next.js 15 dashboard application for Source 4 Industries with TypeScript strict mode, server-side rendering, and sample data integration.

**Tech Stack:**
- Next.js 15.0.3 (App Router)
- React 19 RC
- TypeScript (strict mode enabled)
- Tailwind CSS
- Recharts for visualizations
- Supabase integration (planned)

**Build Command:** `npm run build`
**Dev Command:** `npm run dev` (starts on http://localhost:3000)

---

## Critical Architectural Patterns

### 1. ApiResponse Wrapper Type
All data service functions return a consistent response wrapper:

```typescript
export type ApiResponse<T> = {
  data: T;
  error?: string;
  refreshedAt?: string;
  source?: "supabase" | "sample";
  warning?: string;
};
```

**Key Points:**
- `source: "sample"` indicates mock data (used until Supabase is connected)
- `refreshedAt` is used by pages to display data freshness timestamps
- Pages can check `source === "sample"` to show data connection status alerts

### 2. Server-Side Data Fetching
All data loading happens in async page components:

```typescript
export default async function DashboardPage() {
  const result = await getQuotes();
  const { data, refreshedAt, source } = result;
  // render with data
}
```

**Never use:**
- Client-side `useEffect` for data fetching (use server components)
- Suspense boundaries without proper error handling
- Direct Supabase client calls in components

### 3. Sample Data Pattern
New functions should return sample data with realistic values:

```typescript
export async function getNewMetric(): Promise<ApiResponse<T>> {
  return {
    data: [/* realistic sample objects */],
    source: "sample",
    refreshedAt: new Date().toISOString(),
  };
}
```

Later, replace with actual Supabase query while keeping the same return signature.

---

## Data Service Functions Guide

### Functions Added (Nov 11, 2024)
These functions were missing and causing runtime errors. Now implemented with sample data:

1. **getSkuAdSpendMonthlySummary()** - Monthly ad spend by SKU (3 months of data)
2. **getSkuAdSpendVendorSummary()** - Performance by platform (Amazon, Google, Walmart)
3. **getSkuAdSpendCategorySummary()** - Performance by product category
4. **getSkuAdSpendTopSkus(limit, month)** - Top performing SKUs with drill-down detail

### Functions with Channel Support
- **getLifecyclePerformance(channel?: "email" | "sms")** - Returns email campaigns OR SMS journeys based on channel parameter

### Data Structure Important Notes

**Abandoned Carts:**
- Includes `daysSinceAbandoned` for recovery prioritization
- Assigned to `vendor` for fulfillment tracking
- Statuses: "open" | "contacted" | "recovered"

**Quotes:**
- Track both `createdAt` (always required) and `closeDate` (optional, for closed deals)
- Statuses: "open" | "won" | "lost"
- Used in forecasting and pipeline tracking

**Reviews:**
- ReviewsBlueprint now requires: productId, targetPersona, productName, keyBenefits[], tone
- Used by AI review generator component

---

## Pages and Their Data Requirements

### ✅ Verified Working (Nov 11, 2024)

| Route | Component | Primary Data | Status |
|-------|-----------|--------------|--------|
| `/dashboards/product-ad-spend/` | product-ad-spend-dashboard.tsx | 4 SKU ad spend functions | ✅ |
| `/marketing/blog/` | blog/page.tsx | getBlogInsights() | ✅ |
| `/marketing/email/` | email/page.tsx | getLifecyclePerformance("email") | ✅ |
| `/marketing/sms/` | sms/page.tsx | getLifecyclePerformance("sms") | ✅ |
| `/marketing/google-bing-ads/` | google-bing-ads/page.tsx | getAdsPerformance(), getAdsTimeseries() | ✅ |
| `/marketing/seo/` | seo/page.tsx | getOpportunityKeywords(), getBlogInsights() | ✅ |
| `/sales/quotes/` | quotes/page.tsx | getQuotes() | ✅ |
| `/sales/abandoned-carts/` | abandoned-carts/page.tsx | getAbandonedCarts() | ✅ |

All 23 dashboard pages compile without TypeScript errors.

---

## Common Issues & Solutions

### Issue: "Property X does not exist on type Y"
**Cause:** Component expects a property that isn't in the type or sample data
**Solution:**
1. Check what the component accesses
2. Add property to type definition in `types.ts`
3. Add property to sample data in `data-service.ts`

### Issue: Page shows "sample data" alert
**Cause:** Data service returns `source: "sample"`
**Solution:** This is intentional until Supabase is connected. Pages automatically display info alerts.

### Issue: "refreshedAt is possibly undefined"
**Cause:** Function return type doesn't guarantee refreshedAt
**Solution:** Add `& { refreshedAt: string }` to Promise type signature

### Issue: Build fails with "Cannot find module 'd3-*'"
**Cause:** Missing @types packages for d3 libraries used by Recharts
**Solution:** Run `npm install --save-dev --legacy-peer-deps @types/d3-color @types/d3-path @types/d3-shape @types/d3-scale`

---

## Before Adding New Pages

1. **Check data requirements** - What data does the page component expect?
2. **Create data service function** if it doesn't exist
3. **Define types** in `src/lib/types.ts` for all data structures
4. **Add sample data** with realistic values in `data-service.ts`
5. **Run `npm run build`** to catch TypeScript errors before testing
6. **Test at http://localhost:3000** after running `npm run dev`

---

## Supabase Integration Checklist (For Future)

When connecting real Supabase data:
- [ ] Replace sample data returns with actual Supabase queries
- [ ] Keep the same function signatures and return types
- [ ] Update `source` from "sample" to "supabase"
- [ ] Ensure `refreshedAt` comes from actual data timestamps
- [ ] Remove sample data functions
- [ ] Test all pages with real data
- [ ] Update alerts to show connection status

---

## File Structure Reference

```
src/
├── lib/
│   ├── types.ts          # TypeScript type definitions
│   ├── data-service.ts   # Data fetching functions (sample data)
│   ├── sample-data.ts    # Sample data constants
│   └── utils.ts          # Formatting utilities
├── app/
│   ├── (dashboard)/      # Main dashboard layout
│   │   ├── marketing/    # Email, SMS, SEO, Blog, Google/Bing Ads
│   │   ├── sales/        # Quotes, Abandoned Carts, Home Runs, Snapshots
│   │   ├── operations/   # Automations, Projects, Alerts
│   │   └── performance/  # Home page dashboard
│   └── layout.tsx        # Root layout
└── components/
    ├── charts/           # Chart components (TrendArea, etc)
    └── ui/               # UI components (Card, Table, Badge, etc)
```

---

## Last Updated
Nov 11, 2024 - Dashboard build fixed, all pages compiling successfully
