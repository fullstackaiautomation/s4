-- Validation Queries for SKU Ad Spend Data Import
-- Run these queries after importing to verify data integrity

-- ============================================================================
-- 1. RECORD COUNT VALIDATION
-- ============================================================================

-- Expected: 74,929 records
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT month) as unique_months,
  COUNT(DISTINCT platform) as unique_platforms,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT vendor) as unique_vendors,
  COUNT(DISTINCT product_category) as unique_categories
FROM sku_ad_spend;

-- Check for duplicates (should be 0)
SELECT
  month, platform, sku, campaign,
  COUNT(*) as duplicate_count
FROM sku_ad_spend
GROUP BY month, platform, sku, campaign
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;


-- ============================================================================
-- 2. DATE RANGE VALIDATION
-- ============================================================================

-- Should span from 2022-11 to 2025-10
SELECT
  MIN(month) as earliest_month,
  MAX(month) as latest_month,
  COUNT(DISTINCT month) as total_months
FROM sku_ad_spend;

-- Check for gaps in monthly data
WITH months_expected AS (
  SELECT DATE_TRUNC('month', DATE '2022-11-01' + (i || ' months')::INTERVAL)::TEXT as expected_month
  FROM GENERATE_SERIES(0, 35) as t(i)
)
SELECT expected_month
FROM months_expected
WHERE expected_month NOT IN (SELECT DISTINCT month FROM sku_ad_spend)
ORDER BY expected_month;


-- ============================================================================
-- 3. PLATFORM VALIDATION
-- ============================================================================

-- Should only have 'Google' and 'Bing'
SELECT
  platform,
  COUNT(*) as record_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2) as percentage
FROM sku_ad_spend
GROUP BY platform
ORDER BY record_count DESC;

-- Check for invalid platform values
SELECT DISTINCT platform
FROM sku_ad_spend
WHERE platform NOT IN ('Google', 'Bing')
ORDER BY platform;


-- ============================================================================
-- 4. REQUIRED FIELDS VALIDATION
-- ============================================================================

-- Check for null values in required fields
SELECT
  'month' as field,
  COUNT(*) as null_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2) as null_percentage
FROM sku_ad_spend WHERE month IS NULL
UNION ALL
SELECT 'platform', COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2)
FROM sku_ad_spend WHERE platform IS NULL
UNION ALL
SELECT 'sku', COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2)
FROM sku_ad_spend WHERE sku IS NULL
UNION ALL
SELECT 'title', COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2)
FROM sku_ad_spend WHERE title IS NULL
UNION ALL
SELECT 'vendor', COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2)
FROM sku_ad_spend WHERE vendor IS NULL
UNION ALL
SELECT 'ad_spend', COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2)
FROM sku_ad_spend WHERE ad_spend IS NULL
ORDER BY null_count DESC;


-- ============================================================================
-- 5. NUMERIC DATA VALIDATION
-- ============================================================================

-- Check numeric ranges
SELECT
  'ad_spend' as metric,
  MIN(ad_spend) as min_value,
  MAX(ad_spend) as max_value,
  ROUND(AVG(ad_spend), 2) as avg_value,
  COUNT(*) as non_null_count
FROM sku_ad_spend WHERE ad_spend IS NOT NULL
UNION ALL
SELECT 'impressions', MIN(impressions), MAX(impressions), ROUND(AVG(impressions), 2), COUNT(*)
FROM sku_ad_spend WHERE impressions IS NOT NULL
UNION ALL
SELECT 'clicks', MIN(clicks), MAX(clicks), ROUND(AVG(clicks), 2), COUNT(*)
FROM sku_ad_spend WHERE clicks IS NOT NULL
UNION ALL
SELECT 'ctr', MIN(ctr), MAX(ctr), ROUND(AVG(ctr), 4), COUNT(*)
FROM sku_ad_spend WHERE ctr IS NOT NULL
UNION ALL
SELECT 'avg_cpc', MIN(avg_cpc), MAX(avg_cpc), ROUND(AVG(avg_cpc), 2), COUNT(*)
FROM sku_ad_spend WHERE avg_cpc IS NOT NULL
UNION ALL
SELECT 'conversions', MIN(conversions), MAX(conversions), ROUND(AVG(conversions), 2), COUNT(*)
FROM sku_ad_spend WHERE conversions IS NOT NULL
UNION ALL
SELECT 'revenue', MIN(revenue), MAX(revenue), ROUND(AVG(revenue), 2), COUNT(*)
FROM sku_ad_spend WHERE revenue IS NOT NULL
UNION ALL
SELECT 'price', MIN(price), MAX(price), ROUND(AVG(price), 2), COUNT(*)
FROM sku_ad_spend WHERE price IS NOT NULL
ORDER BY metric;

-- Check for negative values (should all be 0)
SELECT
  'negative_ad_spend' as issue,
  COUNT(*) as count
FROM sku_ad_spend WHERE ad_spend < 0
UNION ALL
SELECT 'negative_impressions', COUNT(*)
FROM sku_ad_spend WHERE impressions < 0
UNION ALL
SELECT 'negative_clicks', COUNT(*)
FROM sku_ad_spend WHERE clicks < 0
UNION ALL
SELECT 'negative_conversions', COUNT(*)
FROM sku_ad_spend WHERE conversions < 0
UNION ALL
SELECT 'negative_revenue', COUNT(*)
FROM sku_ad_spend WHERE revenue < 0
UNION ALL
SELECT 'negative_price', COUNT(*)
FROM sku_ad_spend WHERE price < 0
HAVING COUNT(*) > 0;


-- ============================================================================
-- 6. CALCULATED METRICS VALIDATION
-- ============================================================================

-- Verify CTR calculations (clicks / impressions)
-- Samples with significant discrepancies
SELECT
  sku, month, platform,
  clicks, impressions, ctr,
  ROUND(CAST(clicks AS NUMERIC) / NULLIF(impressions, 0), 4) as calculated_ctr,
  ROUND(ABS(ctr - CAST(clicks AS NUMERIC) / NULLIF(impressions, 0)), 4) as ctr_difference
FROM sku_ad_spend
WHERE clicks IS NOT NULL AND impressions IS NOT NULL AND impressions > 0
  AND ABS(ctr - CAST(clicks AS NUMERIC) / impressions) > 0.001
LIMIT 10;

-- Verify Avg. CPC calculations (ad_spend / clicks)
-- Samples with significant discrepancies
SELECT
  sku, month, platform,
  ad_spend, clicks, avg_cpc,
  ROUND(ad_spend / NULLIF(clicks, 0), 2) as calculated_cpc,
  ROUND(ABS(avg_cpc - (ad_spend / NULLIF(clicks, 0))), 2) as cpc_difference
FROM sku_ad_spend
WHERE clicks IS NOT NULL AND clicks > 0
  AND ABS(avg_cpc - (ad_spend / clicks)) > 0.01
LIMIT 10;


-- ============================================================================
-- 7. DATA COMPLETENESS VALIDATION
-- ============================================================================

-- Summary of data completeness by column
SELECT
  'month' as field,
  COUNT(*) as total_records,
  COUNT(CASE WHEN month IS NOT NULL THEN 1 END) as populated,
  ROUND(COUNT(CASE WHEN month IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentage_complete
FROM sku_ad_spend
UNION ALL
SELECT 'product_category', COUNT(*), COUNT(CASE WHEN product_category IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN product_category IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
UNION ALL
SELECT 'price', COUNT(*), COUNT(CASE WHEN price IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN price IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
UNION ALL
SELECT 'impressions', COUNT(*), COUNT(CASE WHEN impressions IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN impressions IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
UNION ALL
SELECT 'conversions', COUNT(*), COUNT(CASE WHEN conversions IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN conversions IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
UNION ALL
SELECT 'revenue', COUNT(*), COUNT(CASE WHEN revenue IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN revenue IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
UNION ALL
SELECT 'campaign', COUNT(*), COUNT(CASE WHEN campaign IS NOT NULL THEN 1 END),
  ROUND(COUNT(CASE WHEN campaign IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2)
FROM sku_ad_spend
ORDER BY percentage_complete DESC;


-- ============================================================================
-- 8. PRODUCT CATALOG VALIDATION
-- ============================================================================

-- Top SKUs by record count (should match Excel analysis)
SELECT
  sku,
  COUNT(*) as record_count,
  COUNT(DISTINCT month) as months_active,
  COUNT(DISTINCT platform) as platforms
FROM sku_ad_spend
GROUP BY sku
ORDER BY record_count DESC
LIMIT 20;

-- Top Vendors by record count
SELECT
  vendor,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT month) as months_active
FROM sku_ad_spend
GROUP BY vendor
ORDER BY record_count DESC
LIMIT 20;

-- Product Categories (including nulls)
SELECT
  COALESCE(product_category, '[UNCATEGORIZED]') as category,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_skus,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sku_ad_spend), 2) as percentage
FROM sku_ad_spend
GROUP BY product_category
ORDER BY record_count DESC;


-- ============================================================================
-- 9. MONETARY VALUES VALIDATION
-- ============================================================================

-- Total spend summary
SELECT
  SUM(ad_spend) as total_ad_spend,
  SUM(revenue) as total_revenue,
  COUNT(CASE WHEN revenue > 0 THEN 1 END) as records_with_revenue,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi,
  COUNT(*) as total_records
FROM sku_ad_spend;

-- Monthly spend trend
SELECT
  month,
  platform,
  COUNT(*) as record_count,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(revenue) as total_revenue,
  ROUND(SUM(ad_spend) / NULLIF(COUNT(*), 0), 2) as avg_spend_per_record
FROM sku_ad_spend
GROUP BY month, platform
ORDER BY month DESC, platform;


-- ============================================================================
-- 10. IMPORT TIMESTAMP VALIDATION
-- ============================================================================

-- Verify timestamps were added correctly
SELECT
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as records_with_created_at,
  COUNT(CASE WHEN updated_at IS NOT NULL THEN 1 END) as records_with_updated_at,
  MIN(created_at) as earliest_created_at,
  MAX(created_at) as latest_created_at,
  COUNT(CASE WHEN created_at = updated_at THEN 1 END) as records_where_created_equals_updated
FROM sku_ad_spend;
