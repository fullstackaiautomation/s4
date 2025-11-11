-- Fix the schema to allow duplicate (month, platform, sku, campaign) combinations
-- These duplicates are valid in the data - same SKU can appear multiple times
-- with different vendors, categories, or other attributes

-- Step 1: Drop the UNIQUE index that's causing conflicts
DROP INDEX IF EXISTS idx_sku_ad_spend_unique;

-- Step 2: Delete all existing records to start fresh
DELETE FROM sku_ad_spend;

-- Step 3: Create a regular (non-unique) index for query performance
-- This allows duplicate combinations but still indexes them for fast queries
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_lookup
ON sku_ad_spend(month, platform, sku, campaign);

-- Verify the table is empty and ready for data
SELECT COUNT(*) as record_count FROM sku_ad_spend;
