# Website Updates - Source 4 Dashboard

**Created:** 2025-11-18
**Purpose:** Track all page-specific updates for batch deployment

---

## Global Issues

### Performance Problems (Priority: HIGH)
- [ ] **Slow initial page load** - Need to diagnose with Chrome DevTools
- [ ] **Lag between page switches** - Overall navigation speed is terrible
- [ ] Investigate and optimize bundle size, lazy loading, data fetching strategies

---

## Page-by-Page Updates

### 1. Sales Overview Page

#### Data Issues
- [ ] Data not loading correctly from `all_time_sales` Supabase table - diagnose and fix completely
- [ ] Default filters should be: ALL for date, ALL for vendors, ALL for reps

#### UI/UX Changes
- [ ] Add "Custom" option to time period dropdown that opens start/end date calendar widget
- [ ] Remove pipeline icon next to "Sales Overview" title
- [ ] Move "Total Revenue" and "Total Profit" labels to same row as "Monthly Sales Trend" graph title
- [ ] Make bars thicker on the monthly sales trend chart
- [ ] Add trend line on Total Revenue bars

#### Scorecards Enhancement
- [ ] Add 2025, 2024, 2023 monthly averages on right side of each scorecard (smaller font)
  - Total Revenue scorecard
  - Total Profit scorecard
  - Orders scorecard
  - Margin scorecard
- [ ] Monthly average = total for that year ÷ months in dataset

#### Home Runs Table (bottom of page)
- [ ] Show up to 20 rows (or all that qualify if fewer)
- [ ] Rename "Value" column to "Revenue"
- [ ] Add columns in this order: Revenue → Profit → Margin
- [ ] Add "Customer" column between Revenue and Rep columns

---

### 2. Vendor Performance Page (NEW PAGE)

- [ ] Create new page under Sales Overview in navigation
- [ ] Pull data from `all_time_sales` Supabase table
- [ ] Easy vendor selection interface
- [ ] Reference screenshots in folder for design direction
- [ ] Vendor report cards visualization
- [ ] Custom vendor-specific analytics views

---

### 3. Rep Performance Page

#### Filters
- [ ] Add rep selection filter at top
- [ ] Add date range filter (same options as other pages)

#### Data Fixes
- [ ] Fix orders calculation - use orders column from `all_time_sales`, NOT row count

#### Visualizations
- [ ] Add performance over time graph for selected rep
- [ ] Add 2025, 2024, 2023 comparison section

---

### 4. Home Runs Page

#### Table Column Updates
- [ ] Add "Customer" column between Vendor and Rep
- [ ] Rename "Value" column to "Revenue"
- [ ] Add "Profit" column after Revenue
- [ ] Add "Margin" column after Profit

---

### 5. Top Products Page

#### Filter Fixes
- [ ] Connect scorecards to filters (currently not responding)
- [ ] Add date range filter
- [ ] Add vendor filter
- [ ] Keep "All Categories" filter
- [ ] Remove "Sort by ROI" filter

#### UI/UX Changes
- [ ] Redesign scorecards - current look is not visually pleasing
- [ ] Rename "All Products" to "Top Products"
- [ ] Display top 100 products
- [ ] Move "Orders" column before "Revenue" column

---

### 6. Quotes Pipeline Page

#### Data Source
- [ ] Connect to Asana synced data for more accurate pipeline view

#### Scorecards
- [ ] Add scorecard for "Dead Quotes"
- [ ] Factor dead quotes into calculations

#### Calculations Fix
- [ ] Fix win rate calculation - should NOT be 100%
- [ ] Expected win rate is sub-30% for most reps

---

### 7. Abandoned Carts Page

#### Data Connection
- [ ] Replace dummy data with real Asana synced data from Supabase
- [ ] Locate correct Asana data tables

#### Filters
- [ ] Add date range filter
- [ ] Add vendor filter

---

### 8. Product Ad Spend Page

#### Filters
- [ ] Add vendor filter at top
- [ ] Add date range filter at top

#### Data Fixes
- [ ] Fix "Revenue vs. Ad Spend" graph - currently showing no data

#### Layout Changes
- [ ] Move "Top Vendors" section above Revenue vs. Ad Spend graph
- [ ] Move "Category Mix" section above Revenue vs. Ad Spend graph

---

## Implementation Priority

1. **Performance diagnosis and fix** (affects everything)
2. **Sales Overview data fix** (core functionality)
3. **Rep Performance orders calculation fix** (data accuracy)
4. **Quotes Pipeline win rate fix** (data accuracy)
5. **All other UI/UX updates**
6. **New Vendor Performance page**

---

## Notes

- Screenshots for Vendor Performance page design are in this folder
- All date range filters should have consistent options across pages
- Remember: `all_time_sales` rows before 2022-11-01 should be ignored (use SALES_DATA_START constants)
