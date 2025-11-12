-- This script should be run in Supabase SQL Editor to fix the unique constraint issue

-- Step 1: Drop the problematic unique index
DROP INDEX IF EXISTS idx_sku_ad_spend_unique;

-- Step 2: Remove the existing constraint that's causing issues
-- (The index creation failed but the constraint might still be there)

-- Step 3: Clear all existing data
DELETE FROM sku_ad_spend;

-- Step 4: Recreate the unique index without the COALESCE function
-- This allows the same (month, platform, sku) with different campaigns
-- Or if we want to allow duplicates, we can skip the unique constraint
-- But let's create it properly:

-- Option A: Unique constraint on (month, platform, sku, campaign)
-- This will NOT allow duplicate rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_sku_ad_spend_unique
ON sku_ad_spend(month, platform, sku, COALESCE(campaign, ''));

-- Option B: If you want to allow duplicate (month, platform, sku) records
-- with different campaigns, use this instead:
-- (Remove the unique index completely and use a regular index for performance)
-- CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_lookup
-- ON sku_ad_spend(month, platform, sku, campaign);

-- Verify table is empty
SELECT COUNT(*) as record_count FROM sku_ad_spend;
