# Supabase Ad Spend Data Import Guide

This guide walks you through uploading the Google & Bing Ads Product Spend historical data to Supabase for visualization on your web app.

## 📋 Overview

- **Source File:** `Ads Report/All Time Data/Google & Bing Ads Product Spend.xlsx`
- **Records:** 74,929 rows (Nov 2022 - Oct 2025)
- **Destination:** Supabase table `sku_ad_spend`
- **Columns:** 18 data columns + metadata (created_at, updated_at)

## 📁 Files Included

1. **supabase_schema.sql** - Create the table and indexes
2. **import_ad_spend_to_supabase.py** - Python script to upload the data
3. **validation_queries.sql** - Verify data integrity after import
4. **dashboard_queries.sql** - Ready-to-use queries for your web app
5. **SUPABASE_IMPORT_README.md** - This file

## 🚀 Quick Start

### Step 1: Create the Supabase Table

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Click "Run" to execute

This will create:
- Main table: `sku_ad_spend`
- 7 indexes for performance
- 4 pre-built views for common queries
- Automatic timestamp triggers

### Step 2: Prepare Your Environment

Create a `.env` file in the project root with:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
```

**Important:** Use your service role key for bulk imports, not the anon key.

### Step 3: Install Dependencies

```bash
pip install supabase pandas openpyxl python-dotenv
```

### Step 4: Run the Import Script

**Option A: Full import (all 74,929 records)**
```bash
python import_ad_spend_to_supabase.py
```

**Option B: Test mode (first 100 records)**
```bash
python import_ad_spend_to_supabase.py --test
```

**Option C: Custom batch size**
```bash
python import_ad_spend_to_supabase.py --batch-size 500
```

The script will:
- Read the Excel file
- Transform and validate the data
- Upload in batches (default 1000 records per batch)
- Log progress and any errors

### Step 5: Validate the Import

Run the validation queries in `validation_queries.sql` to verify:
- Total record count (should be 74,929)
- Date range (Nov 2022 - Oct 2025)
- Required fields are populated
- Numeric ranges are valid
- No duplicate records

## 📊 Using the Dashboard Queries

The `dashboard_queries.sql` file contains 15 pre-built queries for common visualizations:

1. **Key Metrics Overview** - Summary cards (total spend, ROI, CTR)
2. **Monthly Trend Line** - Spend and performance over time
3. **Platform Comparison** - Google vs Bing metrics
4. **Top Vendors** - Revenue and ROI by vendor
5. **Top Products** - Best performing products
6. **Category Performance** - Spending by product category
7. **Platform Monthly Comparison** - Monthly breakdown by platform
8. **Engagement Metrics** - CTR, CPC, and ROI trends
9. **Highest ROI Products** - Best ROI performers
10. **Lowest ROI Products** - Optimization opportunities
11. **Vendor Performance Heatmap** - Top vendors by month
12. **Product Performance Matrix** - Bubble chart data
13. **Time Period Comparison** - Recent vs historical
14. **Category Monthly Trend** - Category spending over time
15. **Searchable Data View** - Full dataset with filters

## 📈 Integrating with Your Web App

### Using Supabase Client (JavaScript/TypeScript)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Fetch monthly trends
const { data, error } = await supabase
  .from('sku_ad_spend')
  .select('month, platform, ad_spend, revenue')
  .eq('platform', 'Google')
  .order('month', { ascending: false })

// Use with your chart library (Chart.js, Recharts, etc.)
```

### Using the Pre-built Views

```javascript
// Fetch from a specific view
const { data } = await supabase
  .from('monthly_platform_summary')
  .select('*')

// Use for dashboard summary cards
```

### Real-time Subscriptions

```javascript
// Listen for changes
supabase
  .from('sku_ad_spend')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## 🔒 Security Considerations

### Row Level Security (RLS)

If you need to restrict data access:

1. Enable RLS on the table:
```sql
ALTER TABLE sku_ad_spend ENABLE ROW LEVEL SECURITY;
```

2. Create policies:
```sql
-- Allow authenticated users to view all data
CREATE POLICY "Enable read for authenticated users" ON sku_ad_spend
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow service role for inserts/updates
CREATE POLICY "Enable insert for service role" ON sku_ad_spend
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### API Keys

- **Public Anon Key:** For client-side queries (read-only with RLS)
- **Service Role Key:** For server-side operations (full access)

## 🔍 Data Schema Details

### Column Descriptions

| Column | Type | Description | Null % |
|--------|------|-------------|--------|
| id | UUID | Unique record ID | 0% |
| month | TEXT | Month in YYYY-MM format | 0% |
| platform | TEXT | 'Google' or 'Bing' | 0% |
| sku | TEXT | Product SKU | 0% |
| title | TEXT | Product title | 0% |
| vendor | TEXT | Vendor name | 0% |
| product_category | TEXT | Product category | 11.4% |
| ad_spend | DECIMAL | Ad spend in dollars | 0% |
| impressions | INTEGER | Number of impressions | 0.3% |
| clicks | INTEGER | Number of clicks | 0.4% |
| ctr | DECIMAL | Click-through rate | 0.4% |
| avg_cpc | DECIMAL | Average cost per click | 0.4% |
| conversions | DECIMAL | Conversion count | 29.3% |
| revenue | DECIMAL | Total revenue | 38.9% |
| price | DECIMAL | Product price | 97.1% |
| impression_share | DECIMAL | Impression share % | 98.1% |
| impression_share_lost_to_rank | DECIMAL | Lost impression share % | 98.3% |
| absolute_top_impression_share | DECIMAL | Top impression share % | 98.7% |
| campaign | TEXT | Campaign name | 74.6% |
| created_at | TIMESTAMP | Import timestamp | 0% |
| updated_at | TIMESTAMP | Last update timestamp | 0% |

### Key Statistics

- **Time Period:** November 2022 - October 2025 (36 months)
- **Total Records:** 74,929
- **Unique SKUs:** 8,183
- **Unique Vendors:** 78
- **Product Categories:** 116
- **Total Ad Spend:** Sum of all ad_spend values
- **Average Record Ad Spend:** $11.24

## ⚙️ Troubleshooting

### Issue: "SUPABASE_URL and SUPABASE_KEY not set"
**Solution:** Create a `.env` file with your credentials in the project root

### Issue: "Connection timeout"
**Solution:** Check your internet connection and verify the Supabase URL is correct

### Issue: "Duplicate key value violates unique constraint"
**Solution:** The table may already have data. Either:
- Delete existing data: `DELETE FROM sku_ad_spend`
- Use different data that doesn't conflict
- Check the unique constraint: `(month, platform, sku, campaign)`

### Issue: "Batch import failed partway through"
**Solution:**
1. Note the failed record number from logs
2. Check `ad_spend_import.log` for details
3. Consider importing in smaller batches: `--batch-size 100`

### Issue: "Some columns show as NULL"
**Reason:** This is expected. Many columns have high null percentages:
- Price: 97.1% null (rarely populated)
- Impression share: 98.1% null (limited availability)
- Campaign: 74.6% null (not always tracked)
- Revenue: 38.9% null (conversion tracking varies)

## 📞 Need Help?

### Common Questions

**Q: Can I update existing records?**
A: The import script only inserts new data. To update, you'll need a separate update script or manual SQL.

**Q: How often should I refresh the data?**
A: Depends on your needs. You could schedule the import script to run monthly or when new Excel files are available.

**Q: Can I filter by vendor or category?**
A: Yes! Use the WHERE clause in your queries or add filters in your web app:
```javascript
const { data } = await supabase
  .from('sku_ad_spend')
  .select('*')
  .eq('vendor', 'Noblelift')
  .eq('product_category', 'Manual Pallet Jacks')
```

**Q: How do I calculate performance metrics?**
A: Use the formulas in `dashboard_queries.sql`. Example:
```sql
SELECT
  sku,
  SUM(revenue) / SUM(ad_spend) as roi,
  (SUM(clicks) / SUM(impressions)) * 100 as ctr_percent
FROM sku_ad_spend
GROUP BY sku
```

## 🎯 Next Steps

1. ✅ Create the Supabase table (supabase_schema.sql)
2. ✅ Set up environment variables (.env file)
3. ✅ Run the import script
4. ✅ Run validation queries
5. ✅ Build your dashboard using the visualization queries
6. ✅ Set up RLS policies for security
7. ✅ Connect your web app using Supabase client

## 📝 Files Reference

- **Data File:** `Ads Report/All Time Data/Google & Bing Ads Product Spend.xlsx`
- **Schema:** `supabase_schema.sql`
- **Import Script:** `import_ad_spend_to_supabase.py`
- **Validation:** `validation_queries.sql`
- **Dashboard:** `dashboard_queries.sql`
- **This Guide:** `SUPABASE_IMPORT_README.md`

---

**Last Updated:** November 10, 2025
**Data Range:** November 2022 - October 2025
**Total Records:** 74,929
