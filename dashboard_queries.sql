-- Dashboard Visualization Queries
-- These queries are optimized for building interactive visualizations on the web app

-- ============================================================================
-- DASHBOARD QUERY 1: KEY METRICS OVERVIEW
-- Use for: Summary cards showing total spend, ROI, engagement metrics
-- ============================================================================

SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT month) as months_tracked,
  COUNT(DISTINCT sku) as total_products,
  COUNT(DISTINCT vendor) as total_vendors,
  COUNT(DISTINCT product_category) as total_categories,
  SUM(ad_spend) as total_ad_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as overall_roi,
  ROUND(SUM(ad_spend) / NULLIF(SUM(clicks), 0), 2) as avg_cpc,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as avg_ctr_percent
FROM sku_ad_spend;


-- ============================================================================
-- DASHBOARD QUERY 2: MONTHLY TREND LINE
-- Use for: Line chart showing spend and performance over time
-- ============================================================================

SELECT
  month,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  COUNT(DISTINCT sku) as active_products,
  COUNT(DISTINCT vendor) as active_vendors,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY month
ORDER BY month ASC;


-- ============================================================================
-- DASHBOARD QUERY 3: PLATFORM COMPARISON
-- Use for: Pie/bar chart comparing Google vs Bing performance
-- ============================================================================

SELECT
  platform,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_products,
  COUNT(DISTINCT vendor) as unique_vendors,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(SUM(ad_spend) * 100.0 / (SELECT SUM(ad_spend) FROM sku_ad_spend), 2) as spend_percentage,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY platform
ORDER BY total_spend DESC;


-- ============================================================================
-- DASHBOARD QUERY 4: TOP VENDORS PERFORMANCE
-- Use for: Bar chart of top 15 vendors by spend
-- ============================================================================

SELECT
  vendor,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  COUNT(DISTINCT sku) as unique_products,
  COUNT(DISTINCT month) as months_active,
  ROUND(SUM(ad_spend) / NULLIF(COUNT(*), 0), 2) as avg_spend_per_record,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY vendor
ORDER BY total_spend DESC
LIMIT 15;


-- ============================================================================
-- DASHBOARD QUERY 5: TOP PRODUCTS BY SPEND
-- Use for: Table of top 20 products with detailed metrics
-- ============================================================================

SELECT
  sku,
  title,
  vendor,
  product_category,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  COUNT(DISTINCT month) as months_active,
  COUNT(DISTINCT platform) as platforms,
  ROUND(SUM(ad_spend) / NULLIF(COUNT(*), 0), 2) as avg_spend_per_month,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY sku, title, vendor, product_category
ORDER BY total_spend DESC
LIMIT 20;


-- ============================================================================
-- DASHBOARD QUERY 6: PRODUCT CATEGORY PERFORMANCE
-- Use for: Pie/bar chart of spending by category
-- ============================================================================

SELECT
  COALESCE(product_category, 'Uncategorized') as product_category,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_products,
  COUNT(DISTINCT vendor) as unique_vendors,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(SUM(ad_spend) * 100.0 / (SELECT SUM(ad_spend) FROM sku_ad_spend), 2) as spend_percentage,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY product_category
ORDER BY total_spend DESC;


-- ============================================================================
-- DASHBOARD QUERY 7: PLATFORM MONTHLY COMPARISON
-- Use for: Stacked area/bar chart showing platform trends
-- ============================================================================

SELECT
  month,
  SUM(CASE WHEN platform = 'Google' THEN ad_spend ELSE 0 END) as google_spend,
  SUM(CASE WHEN platform = 'Bing' THEN ad_spend ELSE 0 END) as bing_spend,
  SUM(CASE WHEN platform = 'Google' THEN impressions ELSE 0 END) as google_impressions,
  SUM(CASE WHEN platform = 'Bing' THEN impressions ELSE 0 END) as bing_impressions,
  SUM(CASE WHEN platform = 'Google' THEN clicks ELSE 0 END) as google_clicks,
  SUM(CASE WHEN platform = 'Bing' THEN clicks ELSE 0 END) as bing_clicks,
  SUM(CASE WHEN platform = 'Google' THEN revenue ELSE 0 END) as google_revenue,
  SUM(CASE WHEN platform = 'Bing' THEN revenue ELSE 0 END) as bing_revenue
FROM sku_ad_spend
GROUP BY month
ORDER BY month ASC;


-- ============================================================================
-- DASHBOARD QUERY 8: ENGAGEMENT METRICS TREND
-- Use for: Multi-line chart showing CTR, CPC, and Conversion trends
-- ============================================================================

SELECT
  month,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as avg_ctr_percent,
  ROUND(SUM(ad_spend) / NULLIF(SUM(clicks), 0), 2) as avg_cpc,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi,
  ROUND(AVG(CASE WHEN conversions > 0 THEN conversions ELSE NULL END), 2) as avg_conversions,
  COUNT(*) as active_records,
  COUNT(DISTINCT sku) as active_products
FROM sku_ad_spend
GROUP BY month
ORDER BY month ASC;


-- ============================================================================
-- DASHBOARD QUERY 9: HIGHEST ROI PRODUCTS
-- Use for: Table highlighting best performing products
-- ============================================================================

SELECT
  sku,
  title,
  vendor,
  product_category,
  SUM(ad_spend) as total_spend,
  SUM(revenue) as total_revenue,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi,
  SUM(conversions) as total_conversions,
  ROUND(SUM(impressions)::NUMERIC / NULLIF(SUM(conversions), 0), 0) as impressions_per_conversion,
  COUNT(DISTINCT month) as months_active
FROM sku_ad_spend
WHERE ad_spend > 100 AND conversions > 0  -- Filter for significant spend and conversions
GROUP BY sku, title, vendor, product_category
HAVING SUM(revenue) > 0
ORDER BY roi DESC
LIMIT 20;


-- ============================================================================
-- DASHBOARD QUERY 10: LOWEST ROI PRODUCTS (Optimization Opportunities)
-- Use for: Table identifying underperforming products
-- ============================================================================

SELECT
  sku,
  title,
  vendor,
  product_category,
  SUM(ad_spend) as total_spend,
  SUM(revenue) as total_revenue,
  COALESCE(ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2), 0) as roi,
  SUM(clicks) as total_clicks,
  COUNT(DISTINCT month) as months_active,
  (SUM(ad_spend) - COALESCE(SUM(revenue), 0)) as profit_loss
FROM sku_ad_spend
WHERE ad_spend > 100  -- Only products with meaningful spend
GROUP BY sku, title, vendor, product_category
ORDER BY roi ASC, total_spend DESC
LIMIT 20;


-- ============================================================================
-- DASHBOARD QUERY 11: MONTHLY VENDOR PERFORMANCE HEATMAP
-- Use for: Heatmap showing top vendors by month
-- ============================================================================

SELECT
  month,
  vendor,
  SUM(ad_spend) as spend,
  SUM(revenue) as revenue,
  COUNT(DISTINCT sku) as products,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
WHERE vendor IN (
  SELECT vendor FROM sku_ad_spend
  GROUP BY vendor
  ORDER BY SUM(ad_spend) DESC
  LIMIT 10  -- Top 10 vendors
)
GROUP BY month, vendor
ORDER BY month DESC, spend DESC;


-- ============================================================================
-- DASHBOARD QUERY 12: PRODUCT PERFORMANCE MATRIX
-- Use for: Bubble chart or scatter plot (spend vs ROI vs volume)
-- ============================================================================

SELECT
  sku,
  title,
  vendor,
  product_category,
  SUM(ad_spend) as total_spend,
  SUM(revenue) as total_revenue,
  SUM(clicks) as total_clicks,
  SUM(impressions) as total_impressions,
  SUM(conversions) as total_conversions,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  COUNT(*) as record_count
FROM sku_ad_spend
WHERE ad_spend > 50  -- Filter for significance
GROUP BY sku, title, vendor, product_category
ORDER BY total_spend DESC;


-- ============================================================================
-- DASHBOARD QUERY 13: COMPARATIVE METRICS BY TIME PERIOD
-- Use for: Comparing recent performance vs historical average
-- ============================================================================

WITH recent_months AS (
  SELECT * FROM sku_ad_spend
  WHERE month >= (SELECT DATE_TRUNC('month', DATE(MAX(month) || '-01'))::TEXT - '6 months'::INTERVAL FROM sku_ad_spend)
),
early_months AS (
  SELECT * FROM sku_ad_spend
  WHERE month < (SELECT DATE_TRUNC('month', DATE(MAX(month) || '-01'))::TEXT - '6 months'::INTERVAL FROM sku_ad_spend)
)
SELECT
  'Recent (Last 6 Months)' as period,
  SUM(ad_spend) as total_spend,
  COUNT(DISTINCT sku) as products,
  COUNT(DISTINCT vendor) as vendors,
  ROUND(SUM(ad_spend) / NULLIF(COUNT(*), 0), 2) as avg_spend,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM recent_months
UNION ALL
SELECT
  'Earlier Period',
  SUM(ad_spend),
  COUNT(DISTINCT sku),
  COUNT(DISTINCT vendor),
  ROUND(SUM(ad_spend) / NULLIF(COUNT(*), 0), 2),
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2),
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2)
FROM early_months;


-- ============================================================================
-- DASHBOARD QUERY 14: PRODUCT CATEGORY MONTHLY TREND
-- Use for: Stacked area chart of category spending over time
-- ============================================================================

SELECT
  month,
  COALESCE(product_category, 'Uncategorized') as category,
  SUM(ad_spend) as spend,
  SUM(revenue) as revenue,
  COUNT(DISTINCT sku) as products
FROM sku_ad_spend
WHERE product_category IS NOT NULL OR product_category IS NULL
GROUP BY month, product_category
ORDER BY month ASC, spend DESC;


-- ============================================================================
-- DASHBOARD QUERY 15: SEARCH/FILTER FRIENDLY DATA VIEW
-- Use for: Table with filters for user selection
-- ============================================================================

SELECT
  month,
  platform,
  product_category,
  vendor,
  sku,
  title,
  SUM(ad_spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND((SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0)) * 100, 2) as ctr_percent,
  ROUND(SUM(ad_spend) / NULLIF(SUM(clicks), 0), 2) as cpc,
  ROUND(SUM(revenue) / NULLIF(SUM(ad_spend), 0), 2) as roi
FROM sku_ad_spend
GROUP BY month, platform, product_category, vendor, sku, title
ORDER BY month DESC, total_spend DESC;
