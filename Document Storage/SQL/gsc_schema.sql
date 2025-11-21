-- Google Search Console Schema
-- Run this in Supabase SQL Editor to create all necessary tables

-- 1. GSC Sync Log (track sync history)
CREATE TABLE IF NOT EXISTS gsc_sync_log (
    id BIGSERIAL PRIMARY KEY,
    sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    records_synced INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('running', 'success', 'partial', 'failed')),
    errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsc_sync_log_status ON gsc_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_gsc_sync_log_started ON gsc_sync_log(sync_started_at DESC);

-- 2. GSC Site Performance (overall daily metrics)
CREATE TABLE IF NOT EXISTS gsc_site_performance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(10, 6) NOT NULL DEFAULT 0,
    position NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsc_site_performance_date ON gsc_site_performance(date DESC);

-- 3. GSC Search Queries (keyword performance)
CREATE TABLE IF NOT EXISTS gsc_search_queries (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    query TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(10, 6) NOT NULL DEFAULT 0,
    position NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, query)
);

CREATE INDEX IF NOT EXISTS idx_gsc_search_queries_date ON gsc_search_queries(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_search_queries_clicks ON gsc_search_queries(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_search_queries_impressions ON gsc_search_queries(impressions DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_search_queries_query ON gsc_search_queries(query);

-- 4. GSC Page Performance (URL-level performance)
CREATE TABLE IF NOT EXISTS gsc_page_performance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    page TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(10, 6) NOT NULL DEFAULT 0,
    position NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, page)
);

CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_date ON gsc_page_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_clicks ON gsc_page_performance(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_page ON gsc_page_performance(page);

-- 5. GSC Device Performance (desktop, mobile, tablet)
CREATE TABLE IF NOT EXISTS gsc_device_performance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    device TEXT NOT NULL CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET', 'unknown')),
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(10, 6) NOT NULL DEFAULT 0,
    position NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, device)
);

CREATE INDEX IF NOT EXISTS idx_gsc_device_performance_date ON gsc_device_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_device_performance_device ON gsc_device_performance(device);

-- 6. GSC Country Performance (geographic breakdown)
CREATE TABLE IF NOT EXISTS gsc_country_performance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    country TEXT NOT NULL, -- ISO 3166-1 alpha-3 country code (e.g., 'usa', 'can', 'gbr')
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(10, 6) NOT NULL DEFAULT 0,
    position NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, country)
);

CREATE INDEX IF NOT EXISTS idx_gsc_country_performance_date ON gsc_country_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_country_performance_country ON gsc_country_performance(country);
CREATE INDEX IF NOT EXISTS idx_gsc_country_performance_clicks ON gsc_country_performance(clicks DESC);

-- Comments for documentation
COMMENT ON TABLE gsc_sync_log IS 'Tracks Google Search Console sync operations';
COMMENT ON TABLE gsc_site_performance IS 'Overall site search performance by date';
COMMENT ON TABLE gsc_search_queries IS 'Search query (keyword) performance data';
COMMENT ON TABLE gsc_page_performance IS 'Individual page URL performance in search';
COMMENT ON TABLE gsc_device_performance IS 'Performance breakdown by device type';
COMMENT ON TABLE gsc_country_performance IS 'Performance breakdown by country';

-- Grant permissions (adjust as needed for your Supabase setup)
-- These tables are typically accessed via service role, not authenticated users
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
