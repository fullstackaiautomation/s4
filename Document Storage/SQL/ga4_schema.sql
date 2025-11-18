-- =====================================================
-- GOOGLE ANALYTICS 4 INTEGRATION DATABASE SCHEMA
-- Source 4 Industries Dashboard
-- =====================================================
-- Created: 2025-01-18
-- Purpose: Store GA4 traffic, conversions, and e-commerce data
-- =====================================================

-- =====================================================
-- 1. GA4 DAILY TRAFFIC
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_daily_traffic (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2),
  bounce_rate NUMERIC(5,2),
  average_session_duration NUMERIC(10,2), -- seconds
  pageviews INTEGER DEFAULT 0,
  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date)
);

CREATE INDEX idx_ga4_traffic_date ON ga4_daily_traffic(date);

-- =====================================================
-- 2. GA4 TRAFFIC SOURCES
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_traffic_sources (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  source TEXT, -- google, bing, direct, facebook, etc.
  medium TEXT, -- organic, cpc, referral, email
  campaign TEXT,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  revenue NUMERIC(12,2),
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ga4_sources_date ON ga4_traffic_sources(date);
CREATE INDEX idx_ga4_sources_source ON ga4_traffic_sources(source);
CREATE INDEX idx_ga4_sources_medium ON ga4_traffic_sources(medium);

-- =====================================================
-- 3. GA4 PAGE PERFORMANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_page_performance (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  pageviews INTEGER DEFAULT 0,
  unique_pageviews INTEGER DEFAULT 0,
  avg_time_on_page NUMERIC(10,2), -- seconds
  bounce_rate NUMERIC(5,2),
  exits INTEGER DEFAULT 0,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ga4_pages_date ON ga4_page_performance(date);
CREATE INDEX idx_ga4_pages_path ON ga4_page_performance(page_path);

-- =====================================================
-- 4. GA4 E-COMMERCE TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_ecommerce_transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  transaction_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  revenue NUMERIC(12,2),
  tax NUMERIC(12,2),
  shipping NUMERIC(12,2),
  items_purchased INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ga4_ecom_date ON ga4_ecommerce_transactions(date);
CREATE INDEX idx_ga4_ecom_transaction ON ga4_ecommerce_transactions(transaction_id);

-- =====================================================
-- 5. GA4 E-COMMERCE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_ecommerce_items (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  transaction_id TEXT,
  item_name TEXT,
  item_category TEXT,
  item_brand TEXT,
  item_revenue NUMERIC(12,2),
  quantity INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ga4_items_date ON ga4_ecommerce_items(date);
CREATE INDEX idx_ga4_items_name ON ga4_ecommerce_items(item_name);

-- =====================================================
-- 6. GA4 CONVERSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_conversions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  conversion_event TEXT NOT NULL, -- purchase, add_to_cart, begin_checkout, etc.
  source TEXT,
  medium TEXT,
  campaign TEXT,
  conversions INTEGER DEFAULT 0,
  conversion_value NUMERIC(12,2),
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ga4_conv_date ON ga4_conversions(date);
CREATE INDEX idx_ga4_conv_event ON ga4_conversions(conversion_event);

-- =====================================================
-- 7. GA4 SYNC LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS ga4_sync_log (
  id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  date_range_start DATE,
  date_range_end DATE,
  records_synced INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT NOT NULL, -- 'running', 'success', 'partial', 'failed'
  UNIQUE(sync_started_at)
);

CREATE INDEX idx_ga4_sync_started ON ga4_sync_log(sync_started_at);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
