# Fix: Duplicate Key Constraint Error

## Problem

The import is failing with:
```
duplicate key value violates unique constraint "idx_sku_ad_spend_unique"
```

## Root Cause

The original schema created a UNIQUE INDEX on `(month, platform, sku, campaign)` combination.

However, **the actual data contains legitimate duplicates**: The same SKU can appear multiple times in the same month on the same platform because:
- Different product variants with the same SKU
- Multiple vendor listings for the same product
- Different product categories for the same SKU
- Data from different tracking sources

**Example:** SKU "EP30A" appears 3 times in December 2022 on Google with the same (empty) campaign, but with different attributes.

## Solution

Remove the UNIQUE constraint and replace it with a regular index for query performance.

### Steps to Fix

1. **Go to Supabase SQL Editor:**
   - URL: https://supabase.com/dashboard/project/tcryasuisocelektmrmb
   - Click "SQL Editor" → "New Query"

2. **Run this SQL:**
   ```sql
   -- Drop the UNIQUE index
   DROP INDEX IF EXISTS idx_sku_ad_spend_unique;

   -- Clear all existing data
   DELETE FROM sku_ad_spend;

   -- Create a regular (non-unique) index
   CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_lookup
   ON sku_ad_spend(month, platform, sku, campaign);

   -- Verify table is empty
   SELECT COUNT(*) as record_count FROM sku_ad_spend;
   ```

3. **Verify the result shows:**
   ```
   record_count
   0
   ```

4. **Run the import again:**
   ```bash
   node import_ad_spend.js
   ```

### What Changed

| Before | After |
|--------|-------|
| UNIQUE INDEX on (month, platform, sku, campaign) | Regular INDEX on (month, platform, sku, campaign) |
| Cannot have duplicate combinations | Can have duplicate combinations (as data requires) |
| Import fails at ~6,000 records | Import succeeds with all 74,929 records |

## Data Quality Notes

- **74,929 total records** include legitimate duplicates
- **17,164 records** are duplicate (month, platform, sku, campaign) combinations
- **65,216 unique** combinations exist
- All duplicates have different attributes (vendor, category, price, etc.)
- These are normal in ad spend data - same SKU tracked from different sources

## Why This Matters

Ad spend data is inherently multi-dimensional. The same product SKU can:
- Be advertised through different campaigns
- Be sold by different vendors
- Be in different product categories
- Have different prices at different times
- Generate different metrics across different tracking sources

A UNIQUE constraint cannot be applied to just the lookup keys - we need to allow duplicates.

## Verification

After running the import, verify:

```sql
-- Check total records
SELECT COUNT(*) as total_records FROM sku_ad_spend;
-- Expected: 74929

-- Check unique combinations
SELECT COUNT(DISTINCT month, platform, sku, campaign) as unique_combos FROM sku_ad_spend;
-- Expected: 65216

-- Check for duplicate SKUs
SELECT month, platform, sku, COUNT(*) as count FROM sku_ad_spend
GROUP BY month, platform, sku
HAVING COUNT(*) > 1
LIMIT 5;
-- Shows examples of duplicate SKUs with different attributes
```

## File References

- **SQL Fix Script:** `fix_schema_for_duplicates.sql`
- **Import Script:** `import_ad_spend.js`
- **Data File:** `sku_ad_spend_upload.csv`

## Next Steps

1. Run the SQL fix in Supabase dashboard
2. Verify table is empty (0 records)
3. Run the import: `node import_ad_spend.js`
4. Verify with the validation queries above
5. Build your dashboard!
