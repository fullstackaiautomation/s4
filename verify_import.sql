-- Verification queries to confirm successful data import
-- Run these in Supabase SQL Editor to validate

-- 1. Total record count
SELECT COUNT(*) as total_records FROM sku_ad_spend;
-- Expected: 74929

-- 2. Date range
SELECT MIN(month) as earliest, MAX(month) as latest FROM sku_ad_spend;
-- Expected: 2022-11 to 2025-10

-- 3. Platform distribution
SELECT platform, COUNT(*) as count FROM sku_ad_spend GROUP BY platform ORDER BY count DESC;
-- Expected: Google ~37k, Bing ~37k

-- 4. Total ad spend by platform
SELECT
  platform,
  COUNT(*) as records,
  SUM(ad_spend) as total_ad_spend,
  AVG(ad_spend) as avg_ad_spend,
  MIN(ad_spend) as min_ad_spend,
  MAX(ad_spend) as max_ad_spend
FROM sku_ad_spend
GROUP BY platform;

-- 5. Monthly distribution
SELECT
  month,
  COUNT(*) as records,
  COUNT(DISTINCT platform) as platforms,
  COUNT(DISTINCT sku) as unique_skus,
  SUM(ad_spend) as total_spend
FROM sku_ad_spend
GROUP BY month
ORDER BY month DESC
LIMIT 12;
-- Shows last 12 months of data

-- 6. Top 10 vendors by ad spend
SELECT
  vendor,
  COUNT(*) as records,
  COUNT(DISTINCT sku) as unique_skus,
  SUM(ad_spend) as total_ad_spend,
  AVG(ad_spend) as avg_ad_spend
FROM sku_ad_spend
WHERE vendor IS NOT NULL
GROUP BY vendor
ORDER BY total_ad_spend DESC
LIMIT 10;

-- 7. Top 10 categories by ad spend
SELECT
  product_category,
  COUNT(*) as records,
  COUNT(DISTINCT sku) as unique_skus,
  SUM(ad_spend) as total_ad_spend,
  AVG(ad_spend) as avg_ad_spend
FROM sku_ad_spend
WHERE product_category IS NOT NULL
GROUP BY product_category
ORDER BY total_ad_spend DESC
LIMIT 10;

-- 8. Data completeness check
SELECT
  COUNT(*) as total_records,
  COUNT(CASE WHEN month IS NOT NULL THEN 1 END) as month_populated,
  COUNT(CASE WHEN platform IS NOT NULL THEN 1 END) as platform_populated,
  COUNT(CASE WHEN sku IS NOT NULL THEN 1 END) as sku_populated,
  COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as title_populated,
  COUNT(CASE WHEN vendor IS NOT NULL THEN 1 END) as vendor_populated,
  COUNT(CASE WHEN product_category IS NOT NULL THEN 1 END) as category_populated,
  COUNT(CASE WHEN ad_spend IS NOT NULL THEN 1 END) as ad_spend_populated,
  COUNT(CASE WHEN impressions IS NOT NULL THEN 1 END) as impressions_populated,
  COUNT(CASE WHEN clicks IS NOT NULL THEN 1 END) as clicks_populated,
  COUNT(CASE WHEN conversions IS NOT NULL THEN 1 END) as conversions_populated,
  COUNT(CASE WHEN revenue IS NOT NULL THEN 1 END) as revenue_populated,
  COUNT(CASE WHEN campaign IS NOT NULL THEN 1 END) as campaign_populated
FROM sku_ad_spend;

-- 9. Sample records
SELECT * FROM sku_ad_spend LIMIT 5;

-- 10. Test pre-built views
SELECT * FROM monthly_platform_summary LIMIT 12;
SELECT * FROM vendor_performance_summary LIMIT 10;
SELECT * FROM category_performance_summary LIMIT 10;
SELECT * FROM platform_comparison_by_month LIMIT 12;
