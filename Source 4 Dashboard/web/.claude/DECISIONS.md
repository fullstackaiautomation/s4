# Architectural Decisions

## Session: Dashboard Build & Data Schema Fixes (Nov 11, 2024)

### Decision 1: Add Missing Data Service Functions for Product Ad Spend
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** The product-ad-spend dashboard page was failing at runtime with "getSkuAdSpendMonthlySummary is not a function"

**Decision:**
Create 4 new data service functions to support SKU-level ad spend analytics:
- `getSkuAdSpendMonthlySummary()` - Monthly aggregated metrics across all SKUs
- `getSkuAdSpendVendorSummary()` - Performance by vendor/platform
- `getSkuAdSpendCategorySummary()` - Performance by product category
- `getSkuAdSpendTopSkus()` - Drill-down into individual SKUs with pagination

**Rationale:**
- The page component was already importing and calling these functions
- Missing implementations caused runtime crashes before TypeScript compilation could catch them
- Creating sample data implementations unblocks the UI while backend integration can be done later
- Functions return consistent `ApiResponse` wrapper with `source: "sample"` and `refreshedAt` metadata

**Implementation Details:**
All functions return data with the same structure:
```typescript
ApiResponse<T> & { source: "supabase" | "sample"; refreshedAt: string }
```
This allows pages to display data freshness and indicate when live integrations aren't available.

---

### Decision 2: Use TypeScript Strict Mode as API Contract Enforcer
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Build was catching 20+ type mismatches that weren't caught at runtime

**Decision:**
Rather than making all properties optional to "fix" TypeScript errors, we enforced strict types and updated sample data to match component expectations.

**Rationale:**
- TypeScript catches errors before production
- Forcing explicit types ensures all components will work with real data from Supabase later
- Optional chaining (`?.`) was being used in components without proper null checks
- Strong typing makes future API integrations safer

**Pattern Used:**
When a page component accesses `item.property`, we ensure that property exists in the type definition and is present in all sample data objects.

---

### Decision 3: Add `refreshedAt` Timestamps to Data Service Returns
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Multiple pages display "Refreshed {timestamp}" but data services weren't providing this

**Decision:**
Add `refreshedAt: new Date().toISOString()` to all data service function returns that need it.

**Rationale:**
- Pages destructure `refreshedAt` to show data freshness to users
- With sample data, `refreshedAt` is current time
- With Supabase integration, this will come from actual data freshness timestamps
- Gives consistent UX pattern across all dashboard pages

**Functions Updated:**
- getQuotes()
- getAbandonedCarts()
- getHomeRuns()
- getAdsPerformance()
- getAdsTimeseries()
- getSkuAdSpendMonthlySummary()
- getSkuAdSpendVendorSummary()
- getSkuAdSpendCategorySummary()
- getSkuAdSpendTopSkus()

---

### Decision 4: Implement Channel-Aware Email/SMS Data Service
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Email and SMS pages were calling same function `getLifecyclePerformance()` but expecting different data

**Decision:**
`getLifecyclePerformance(channel?: string)` accepts optional "email" or "sms" parameter and returns appropriate campaign/journey data.

**Rationale:**
- Email page calls `getLifecyclePerformance("email")` and expects email campaigns
- SMS page calls `getLifecyclePerformance("sms")` and expects SMS journeys
- Single function reduces code duplication
- Returns different datasets with slightly different metrics (SMS has higher open/click rates naturally)

**Data Structure:**
Both email and SMS data have identical shape for consistent component rendering:
```typescript
{
  id: string;
  name: string;
  type: "journey" | "blast";
  status: "active" | "paused" | "draft";
  sendCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  lastRunAt?: string;
}
```

---

### Decision 5: Enhance ReviewsBlueprint Type for Review Generator Component
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Review generator component expected fields not in ReviewsBlueprint type

**Decision:**
Extended ReviewsBlueprint type to include:
- `productId: string` - Link to SKU
- `targetPersona: string` - Customer persona for the product
- `productName: string` - Display name for the product
- `keyBenefits: string[]` - Feature benefits for review generation
- `tone: string` - Voice/tone style for AI-generated reviews

**Rationale:**
- These fields are used by the review generator to create contextual review text
- Persona and benefits are critical for realistic AI-generated content
- Makes ReviewsBlueprint a complete product marketing profile

---

### Decision 6: Make SKU Pricing Required in Types
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** SkuRecord had optional price/cost but component was accessing without null checks

**Decision:**
Changed SkuRecord type to require `price` and `cost` as non-optional properties.

**Rationale:**
- SKU master data without price information is incomplete
- Component renders price in a table without conditional checks
- Sample data already includes prices
- Future database schema will require these fields

---

### Decision 7: Add Timestamps and Tracking Fields to Quotes
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Quotes page sorts by `createdAt` and displays `closeDate`

**Decision:**
Added to Quote type:
- `createdAt: string` (required) - When quote was created
- `closeDate?: string` (optional) - When quote was won/lost

**Rationale:**
- Sales workflows need quote creation tracking
- Closing date is important for forecasting but optional for open quotes
- Both fields are already displayed in the quotes table UI

---

### Decision 8: Extend Abandoned Carts with Time Tracking
**Date:** Nov 11, 2024
**Status:** ✅ Implemented
**Context:** Abandoned carts page tracks engagement duration and vendor assignment

**Decision:**
Added to abandoned carts:
- `createdAt: string` - When the cart was abandoned
- `daysSinceAbandoned: number` - Time duration for recovery urgency
- `vendor: string` - Which vendor/fulfillment partner handles recovery

**Rationale:**
- Recovery efforts are time-sensitive (newer carts convert better)
- Vendor assignment enables accountability and fulfillment tracking
- These fields are displayed in the UI already

---

## Type System Improvements Summary

**Files Modified:**
- `src/lib/types.ts` - 8 type definitions updated
- `src/lib/data-service.ts` - 4 new functions, 10+ function return types enhanced
- `src/lib/sample-data.ts` - Added required fields to sample data objects

**Total Cascading Fixes:** ~20 type mismatches resolved through iterative compilation

**Build Result:** ✅ All 23 dashboard pages compile without TypeScript errors
