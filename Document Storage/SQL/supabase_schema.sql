-- Supabase Schema for SKU Ad Spend Data
-- Table to store Google & Bing Ads product spend performance data
-- Data from: All Time Data/Google & Bing Ads Product Spend.xlsx

-- Main table for ad performance metrics
CREATE TABLE IF NOT EXISTS sku_ad_spend (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Dimensions (Always populated - required)
  month TEXT NOT NULL,  -- Format: YYYY-MM (e.g., "2022-11")
  platform TEXT NOT NULL,  -- 'Google' or 'Bing'
  sku TEXT NOT NULL,  -- Product SKU identifier
  title TEXT NOT NULL,  -- Product title/name
  vendor TEXT NOT NULL,  -- Vendor/manufacturer name

  -- Optional Dimension
  product_category TEXT,  -- Product category (can be NULL - 11.4% of records)

  -- Core Metrics
  ad_spend DECIMAL(10, 2) NOT NULL,  -- Advertising spend in dollars

  -- Performance Metrics (Mostly populated - <1% null)
  impressions INTEGER,  -- Number of ad impressions
  clicks INTEGER,  -- Number of clicks
  ctr DECIMAL(5, 4),  -- Click-through rate (stored as decimal: 0.0107 = 1.07%)
  avg_cpc DECIMAL(8, 2),  -- Average cost per click

  -- Conversion Metrics (Partially populated - ~30-40% null)
  conversions DECIMAL(8, 2),  -- Number of conversions
  revenue DECIMAL(10, 2),  -- Total revenue generated

  -- Product Information (Rarely populated - 97% null)
  price DECIMAL(10, 2),  -- Product price

  -- Advanced Metrics (Rarely populated - 98%+ null, stored as decimal)
  impression_share DECIMAL(6, 4),  -- Impression share percentage
  impression_share_lost_to_rank DECIMAL(6, 4),  -- Lost impression share due to rank
  absolute_top_impression_share DECIMAL(6, 4),  -- Absolute top impression share

  -- Campaign Information (Often missing - 75% null)
  campaign TEXT,  -- Campaign name/identifier

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_platform CHECK (platform IN ('Google', 'Bing')),
  CONSTRAINT positive_ad_spend CHECK (ad_spend >= 0),
  CONSTRAINT valid_impressions CHECK (impressions IS NULL OR impressions >= 0),
  CONSTRAINT valid_clicks CHECK (clicks IS NULL OR clicks >= 0),
  CONSTRAINT valid_conversions CHECK (conversions IS NULL OR conversions >= 0),
  CONSTRAINT valid_revenue CHECK (revenue IS NULL OR revenue >= 0),
  CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0)
);

-- Composite unique constraint to prevent duplicate records
-- Using a partial unique index to handle NULL campaign values
CREATE UNIQUE INDEX IF NOT EXISTS idx_sku_ad_spend_unique ON sku_ad_spend(month, platform, sku, COALESCE(campaign, ''));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_month ON sku_ad_spend(month DESC);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_platform ON sku_ad_spend(platform);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_sku ON sku_ad_spend(sku);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_vendor ON sku_ad_spend(vendor);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_category ON sku_ad_spend(product_category);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_month_platform ON sku_ad_spend(month, platform);
CREATE INDEX IF NOT EXISTS idx_sku_ad_spend_vendor_month ON sku_ad_spend(vendor, month);

-- Enable Row Level Security (optional - uncomment if needed)
-- ALTER TABLE sku_ad_spend ENABLE ROW LEVEL SECURITY;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sku_ad_spend_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sku_ad_spend_updated_at_trigger
  BEFORE UPDATE ON sku_ad_spend
  FOR EACH ROW
  EXECUTE FUNCTION update_sku_ad_spend_timestamp();

-- Optional: Create helpful views for common queries

-- View: Monthly summary by platform
CREATE OR REPLACE VIEW monthly_platform_summary AS
SELECT
  month,
  platform,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT vendor) as unique_vendors,
  COUNT(DISTINCT product_category) as unique_categories,
  SUM(ad_spend) as total_ad_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  AVG(ad_spend) as avg_ad_spend,
  ROUND(AVG(CAST(ctr AS NUMERIC)), 4) as avg_ctr
FROM sku_ad_spend
GROUP BY month, platform
ORDER BY month DESC, platform;

-- View: Vendor performance across all time
CREATE OR REPLACE VIEW vendor_performance_summary AS
SELECT
  vendor,
  COUNT(*) as record_count,
  COUNT(DISTINCT month) as months_active,
  COUNT(DISTINCT sku) as unique_skus,
  SUM(ad_spend) as total_ad_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(SUM(ad_spend)::NUMERIC / SUM(clicks)::NUMERIC, 2) as avg_cpc,
  ROUND((SUM(clicks)::NUMERIC / SUM(impressions)::NUMERIC) * 100, 2) as avg_ctr_percent
FROM sku_ad_spend
WHERE clicks > 0 AND impressions > 0
GROUP BY vendor
ORDER BY total_ad_spend DESC;

-- View: Product category performance
CREATE OR REPLACE VIEW category_performance_summary AS
SELECT
  product_category,
  COUNT(*) as record_count,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT vendor) as unique_vendors,
  COUNT(DISTINCT month) as months_active,
  SUM(ad_spend) as total_ad_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(AVG(ad_spend), 2) as avg_ad_spend_per_record
FROM sku_ad_spend
WHERE product_category IS NOT NULL
GROUP BY product_category
ORDER BY total_ad_spend DESC;

-- View: Platform comparison by month
CREATE OR REPLACE VIEW platform_comparison_by_month AS
SELECT
  month,
  SUM(CASE WHEN platform = 'Google' THEN ad_spend ELSE 0 END) as google_ad_spend,
  SUM(CASE WHEN platform = 'Bing' THEN ad_spend ELSE 0 END) as bing_ad_spend,
  SUM(CASE WHEN platform = 'Google' THEN impressions ELSE 0 END) as google_impressions,
  SUM(CASE WHEN platform = 'Bing' THEN impressions ELSE 0 END) as bing_impressions,
  SUM(CASE WHEN platform = 'Google' THEN clicks ELSE 0 END) as google_clicks,
  SUM(CASE WHEN platform = 'Bing' THEN clicks ELSE 0 END) as bing_clicks,
  SUM(CASE WHEN platform = 'Google' THEN revenue ELSE 0 END) as google_revenue,
  SUM(CASE WHEN platform = 'Bing' THEN revenue ELSE 0 END) as bing_revenue
FROM sku_ad_spend
GROUP BY month
ORDER BY month DESC;
