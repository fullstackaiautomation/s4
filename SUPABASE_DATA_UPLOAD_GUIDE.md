# Supabase Data Upload Guide

## Overview

This guide explains how to upload the 74,929 ad spend records to your Supabase database. The data has been fully prepared and transformed. You now have **three options** to upload it.

---

## Data Files

The following files are ready for use:

1. **sku_ad_spend_upload.csv** (15.13 MB)
   - Contains all 74,929 records in CSV format
   - All data types properly formatted
   - Ready for direct upload to Supabase

2. **import_ad_spend.js** (Node.js script)
   - Automated upload via Node.js
   - Handles batching and error recovery
   - Requires: `npm install @supabase/supabase-js csv-parse dotenv`

3. **import_ad_spend_to_supabase.py** (Python script)
   - Automated upload via Python (for local execution)
   - Handles batching and validation
   - Requires: `pip install supabase pandas openpyxl python-dotenv`

---

## Option 1: Manual Upload via Supabase Dashboard (Easiest)

### Steps:

1. **Go to your Supabase dashboard:**
   - URL: https://supabase.com/dashboard/project/tcryasuisocelektmrmb

2. **Navigate to the Table Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Or go to "Table Editor" and select `sku_ad_spend`

3. **Import the CSV:**
   - Look for an "Import" button or "Insert Data" option
   - Select `sku_ad_spend_upload.csv`
   - Preview the mapping and click "Import"

4. **Verify the import:**
   - Once complete, you should see 74,929 rows in the table
   - Run a quick query:
     ```sql
     SELECT COUNT(*) as total_records FROM sku_ad_spend;
     ```

### Advantages:
- ✓ No setup required
- ✓ Visual progress feedback
- ✓ Easy to verify results immediately

### Time Expected: 5-10 minutes

---

## Option 2: Node.js Automated Upload

### Prerequisites:

1. **Install Node.js dependencies:**
   ```bash
   npm install @supabase/supabase-js csv-parse dotenv
   ```

2. **Ensure .env file exists:**
   ```
   SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Steps:

1. **Run the import script:**
   ```bash
   node import_ad_spend.js
   ```

2. **For test mode (first 100 records only):**
   ```bash
   node import_ad_spend.js --test
   ```

3. **With custom batch size:**
   ```bash
   node import_ad_spend.js --batch-size 500
   ```

### Advantages:
- ✓ Automated batching (handles network interruptions)
- ✓ Real-time progress reporting
- ✓ Error recovery
- ✓ Works with .env configuration

### Time Expected: 3-5 minutes

---

## Option 3: Python Automated Upload

### Prerequisites:

1. **Install Python dependencies:**
   ```bash
   pip install supabase pandas openpyxl python-dotenv
   ```

2. **Ensure .env file exists:**
   ```
   SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Steps:

1. **Run the import script:**
   ```bash
   python import_ad_spend_to_supabase.py
   ```

2. **For test mode (first 100 records only):**
   ```bash
   python import_ad_spend_to_supabase.py --test
   ```

3. **With custom batch size:**
   ```bash
   python import_ad_spend_to_supabase.py --batch-size 500
   ```

### Advantages:
- ✓ Integrated with pandas for data validation
- ✓ Detailed logging
- ✓ Excel file re-reading capability
- ✓ Data type verification

### Time Expected: 3-5 minutes

---

## Verification Queries

After upload, run these queries in your Supabase SQL Editor to verify:

### 1. Row Count
```sql
SELECT COUNT(*) as total_records FROM sku_ad_spend;
-- Expected: 74,929
```

### 2. Date Range
```sql
SELECT MIN(month) as earliest, MAX(month) as latest FROM sku_ad_spend;
-- Expected: 2022-11 to 2025-10
```

### 3. Platform Distribution
```sql
SELECT platform, COUNT(*) as count FROM sku_ad_spend GROUP BY platform;
-- Expected: Google ~37k, Bing ~37k
```

### 4. Total Ad Spend
```sql
SELECT SUM(ad_spend) as total_ad_spend FROM sku_ad_spend;
-- Expected: ~$3.2M (approximate)
```

### 5. Record Sample
```sql
SELECT * FROM sku_ad_spend LIMIT 5;
```

---

## Database Schema

The `sku_ad_spend` table includes:

### Required Fields (Always populated):
- `month` (TEXT) - Format: YYYY-MM
- `platform` (TEXT) - 'Google' or 'Bing'
- `sku` (TEXT) - Product SKU
- `title` (TEXT) - Product title
- `vendor` (TEXT) - Vendor name
- `ad_spend` (DECIMAL) - Advertising cost

### Performance Metrics (Mostly populated):
- `impressions` (INTEGER)
- `clicks` (INTEGER)
- `ctr` (DECIMAL) - Click-through rate
- `avg_cpc` (DECIMAL) - Average cost per click

### Conversion Metrics (30-40% populated):
- `conversions` (DECIMAL)
- `revenue` (DECIMAL)

### Optional Fields:
- `product_category` (TEXT) - 11.4% null
- `price` (DECIMAL) - 97% null
- `impression_share` (DECIMAL) - 98%+ null
- `impression_share_lost_to_rank` (DECIMAL) - 98%+ null
- `absolute_top_impression_share` (DECIMAL) - 98%+ null
- `campaign` (TEXT) - 75% null

### Metadata:
- `id` (UUID) - Primary key
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Pre-built Views

After import, you can use these pre-built views for analysis:

### 1. Monthly Platform Summary
```sql
SELECT * FROM monthly_platform_summary;
```
Provides monthly totals by platform (Google vs Bing).

### 2. Vendor Performance
```sql
SELECT * FROM vendor_performance_summary;
```
Shows lifetime performance metrics by vendor.

### 3. Category Performance
```sql
SELECT * FROM category_performance_summary;
```
Analyzes performance by product category.

### 4. Platform Comparison
```sql
SELECT * FROM platform_comparison_by_month;
```
Compares Google and Bing side-by-side each month.

---

## Troubleshooting

### "Column type mismatch" errors
- The CSV file includes created_at and updated_at timestamps
- These are auto-generated during the prepared CSV creation
- If there are errors, manually clear the created_at/updated_at columns from the CSV

### "Unique constraint violated"
- This shouldn't happen with fresh data
- If it does, check if data was already partially imported
- Use the UNIQUE INDEX on (month, platform, sku, campaign)

### "Out of memory" during import
- If using large batch sizes, reduce with `--batch-size 500`
- Or use the manual CSV upload option in Supabase dashboard

### Null value handling
- NaN values from Excel are properly converted to NULL
- Text fields with 'None' or 'NaN' strings are converted to NULL
- Empty strings in text fields are converted to NULL

---

## Data Quality Notes

- **74,929 total records** spanning Nov 2022 - Oct 2025
- **2 platforms**: Google, Bing
- **116 product categories**
- **78 unique vendors**
- **Multi-month campaign data** for comprehensive analysis
- All numeric values properly rounded for precision
- Indexes created for common queries (month, platform, vendor, etc.)

---

## Next Steps

After uploading the data:

1. **Build your dashboard:**
   - Navigate to Source 4 Dashboard/web
   - Create React components to query and visualize the data
   - Use the pre-built views for quick charts

2. **Create API endpoints:**
   - Set up Supabase RLS policies if needed
   - Create database functions for common queries

3. **Build visualization:**
   - Monthly trends (Google vs Bing)
   - Top vendors by ad spend
   - Category performance analysis
   - Time-series revenue tracking

---

## Questions?

Check the SUPABASE_IMPORT_README.md for additional details about the schema and data preparation process.
