# All Time Sales Data Import Guide

## Overview
Successfully prepared all-time sales database for upload to Supabase. The data contains 22,883 sales transaction records with 31 fields.

## Files Created

### 1. CSV Data File
**File:** `all_time_sales_data.csv`
- **Size:** 5.83 MB
- **Records:** 22,883
- **Columns:** 31
- **Ready for:** Direct upload to Supabase

### 2. Database Schema
**File:** `all_time_sales_schema.sql`
- **Table Name:** `all_time_sales`
- **Features:**
  - 30 columns with proper data types
  - Automatic timestamp management (created_at, updated_at)
  - Data validation constraints
  - 9 performance indexes
  - 4 analytical views:
    - `monthly_sales_summary` - Monthly sales aggregates
    - `vendor_sales_performance` - Vendor metrics
    - `category_sales_performance` - Product category metrics
    - `sales_by_channel` - Online vs Local sales

### 3. Python Upload Script
**File:** `import_all_time_sales.py`
- Automated data upload to Supabase
- Handles data transformation and type conversion
- Batch processing (1000 records per batch)
- Error handling and progress reporting

### 4. Setup Script
**File:** `setup_all_time_sales.py`
- Creates schema in Supabase
- Verifies table creation

## Steps to Complete Upload

### Option A: Using Supabase Dashboard (Manual - No coding needed)

1. **Create the table in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy entire contents of `all_time_sales_schema.sql`
   - Paste and run in SQL Editor
   - Wait for success confirmation

2. **Upload the data:**
   - Go to Supabase Dashboard → Table Editor
   - Click on `all_time_sales` table
   - Click "Import data"
   - Select `all_time_sales_data.csv` file
   - Click "Import"
   - Wait for upload to complete

### Option B: Using Python Script (Automated)

1. **Create the schema:**
   ```bash
   python3 setup_all_time_sales.py
   ```

2. **Upload the data:**
   ```bash
   python3 import_all_time_sales.py
   ```

### Option C: Using Command Line (psql)

1. **Create the schema:**
   ```bash
   psql postgresql://postgres:PASSWORD@HOST:5432/postgres < all_time_sales_schema.sql
   ```

2. **Upload data with psql:**
   ```bash
   psql -c "COPY all_time_sales FROM STDIN WITH (FORMAT csv, HEADER)" < all_time_sales_data.csv
   ```

## Table Structure

### Core Columns
- `id` - UUID primary key
- `month` - YYYY-MM format
- `year` - Year integer
- `sku` - Product SKU
- `vendor` - Vendor name

### Customer & Transaction
- `customer` - Customer name
- `rep` - Sales rep name
- `online_local` - Sales channel
- `invoice_number` - Invoice ID
- `date` - Transaction timestamp

### Financial Data
- `order_quantity` - Quantity ordered
- `sales_each` - Unit price
- `sales_total` - Total sales
- `cost_each` - Unit cost
- `cost_total` - Total cost
- `shipping` - Shipping cost
- `discount` - Discount amount
- `refunds` - Refund amount
- `invoice_total` - Invoice total
- `profit_total` - Profit
- `roi` - Return on investment
- `ad_spend` - Associated ad spend

### Product Information
- `description` - Product description
- `product_category` - Specific category
- `overall_product_category` - Broad category

### Location Data
- `state` - State code
- `region` - Region code
- `shipping_method` - Shipping method
- `user_email` - User email

## Verification Queries

After successful upload, verify data:

```sql
-- Check record count
SELECT COUNT(*) as total_records FROM all_time_sales;

-- Check month range
SELECT MIN(month) as earliest, MAX(month) as latest FROM all_time_sales;

-- Check vendors
SELECT COUNT(DISTINCT vendor) as unique_vendors FROM all_time_sales;

-- View monthly summary
SELECT * FROM monthly_sales_summary LIMIT 10;

-- View vendor performance
SELECT * FROM vendor_sales_performance LIMIT 10;
```

## Integration with Dashboard

The data is now ready to be visualized in the Source 4 Dashboard. The dashboard can query:

1. **Monthly sales trends** from `monthly_sales_summary` view
2. **Vendor performance** from `vendor_sales_performance` view
3. **Product category analysis** from `category_sales_performance` view
4. **Channel comparison** from `sales_by_channel` view

Raw transaction data for detailed analysis via `all_time_sales` table.

## Data Quality Notes

- **Total Records:** 22,883
- **Date Range:** Oct 2024 - Nov 2024 (sample data)
- **Missing Values:** Some columns have NULL values (optional fields)
- **Data Types:** All properly converted (numerics, timestamps, text)

## Next Steps

1. Choose upload method (A, B, or C above)
2. Execute schema creation
3. Upload CSV data
4. Verify with provided queries
5. Update dashboard to query new views
6. Monitor performance with indexes

---

**Status:** Ready for upload ✓
**Created:** Nov 10, 2025
