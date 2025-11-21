# Google Search Console Integration Guide

## Overview

The Google Search Console (GSC) integration syncs your website's search performance data from Google Search Console to Supabase, enabling real-time dashboards and analytics.

## What Data is Synced

### 1. Site Performance (Overall Metrics)
- Daily clicks, impressions, CTR, average position
- Aggregated across all queries and pages

### 2. Search Queries (Keywords)
- Individual search terms that show your site
- Clicks, impressions, CTR, and average position per query
- Up to 25,000 queries per sync

### 3. Page Performance
- Performance metrics for each URL on your site
- Clicks, impressions, CTR, position per page
- Up to 25,000 pages per sync

### 4. Device Breakdown
- Performance by device type (Desktop, Mobile, Tablet)
- Daily metrics for each device category

### 5. Country Breakdown
- Geographic performance data
- Top 1,000 countries by traffic per sync
- ISO 3166-1 alpha-3 country codes (usa, can, gbr, etc.)

## Database Schema

Run the SQL file to create all tables:
```sql
-- Location: Document Storage/SQL/gsc_schema.sql
```

**Tables created:**
1. `gsc_sync_log` - Tracks sync history
2. `gsc_site_performance` - Overall daily metrics
3. `gsc_search_queries` - Keyword performance
4. `gsc_page_performance` - URL-level performance
5. `gsc_device_performance` - Device breakdown
6. `gsc_country_performance` - Geographic breakdown

## Setup Instructions

### 1. Enable Google Search Console API
1. Go to: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com?project=s4-dashboard
2. Click "Enable"

### 2. Add Service Account to Search Console
1. Go to: https://search.google.com/search-console
2. Select your property: `source4industries.com`
3. Settings → Users and permissions → Add user
4. Email: `source4-dashboard-ga4@s4-dashboard.iam.gserviceaccount.com`
5. Permission: Full or Restricted
6. Click Add

### 3. Environment Variables
Already configured in `.env.local`:
```bash
GSC_SITE_URL=sc-domain:source4industries.com
GSC_CREDENTIALS_JSON={...same as GA4_CREDENTIALS_JSON...}
```

### 4. Create Database Tables
1. Open Supabase SQL Editor
2. Copy contents from `Document Storage/SQL/gsc_schema.sql`
3. Run the SQL to create all tables

## API Usage

### Manual Sync
```bash
# Sync last 7 days (default)
curl -X POST http://localhost:3000/api/sync/gsc \
  -H "Content-Type: application/json" \
  -d '{}'

# Full sync from 2024-01-01
curl -X POST http://localhost:3000/api/sync/gsc \
  -H "Content-Type: application/json" \
  -d '{"fullSync": true}'

# Custom date range
curl -X POST http://localhost:3000/api/sync/gsc \
  -H "Content-Type: application/json" \
  -d '{
    "dateRange": {
      "startDate": "2024-11-01",
      "endDate": "2024-11-20"
    }
  }'

# Sync only specific data types
curl -X POST http://localhost:3000/api/sync/gsc \
  -H "Content-Type: application/json" \
  -d '{
    "syncQueries": true,
    "syncPages": false,
    "syncDevices": false,
    "syncCountries": false,
    "syncSitePerformance": true
  }'
```

### PowerShell (Windows)
```powershell
# Quick sync
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/sync/gsc' `
  -Body '{}' -ContentType 'application/json'

# Full sync
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/sync/gsc' `
  -Body '{"fullSync":true}' -ContentType 'application/json'
```

## Daily Automation

### Option 1: Vercel Cron Jobs (Recommended)
Create `src/app/api/cron/gsc/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createGSCSync } from '@/lib/integrations/gsc-sync';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gscSync = createGSCSync();
  if (!gscSync) {
    return NextResponse.json({ error: 'GSC not configured' }, { status: 500 });
  }

  // Sync last 7 days daily
  const result = await gscSync.sync({
    fullSync: false,
    dateRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  });

  return NextResponse.json(result);
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/gsc",
    "schedule": "0 6 * * *"
  }]
}
```

### Option 2: External Cron Service
Use cron-job.org or similar to hit your API endpoint daily.

## Data Freshness

- **Google Search Console**: Data is typically 2-3 days delayed
- **Recommended Sync Frequency**: Daily (covers last 7 days to catch updates)
- **Full Sync**: Monthly or as needed to backfill historical data

## Querying Data

### Top 10 Keywords Today
```sql
SELECT query, clicks, impressions, ctr, position
FROM gsc_search_queries
WHERE date = CURRENT_DATE - INTERVAL '3 days'
ORDER BY clicks DESC
LIMIT 10;
```

### Top Pages This Month
```sql
SELECT page, SUM(clicks) as total_clicks, SUM(impressions) as total_impressions
FROM gsc_page_performance
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY page
ORDER BY total_clicks DESC
LIMIT 10;
```

### Device Performance Trend (Last 30 Days)
```sql
SELECT date, device, clicks, impressions, ctr
FROM gsc_device_performance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC, device;
```

### Country Performance
```sql
SELECT country, SUM(clicks) as total_clicks, AVG(position) as avg_position
FROM gsc_country_performance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY country
ORDER BY total_clicks DESC
LIMIT 20;
```

## Troubleshooting

### "GSC connection failed"
- Verify service account email is added to Search Console property
- Check that GSC API is enabled in Google Cloud Console
- Verify GSC_SITE_URL format: `sc-domain:yourdomain.com` or `https://www.yourdomain.com`

### "No data returned"
- GSC data has 2-3 day delay - check older dates
- Verify your site has search traffic in Search Console web interface
- Check date range is within last 16 months (GSC data retention limit)

### Sync Errors
Check sync log table:
```sql
SELECT * FROM gsc_sync_log
ORDER BY sync_started_at DESC
LIMIT 10;
```

## Files Created

**Integration Code:**
- `src/lib/integrations/gsc-client.ts` - API client
- `src/lib/integrations/gsc-sync.ts` - Sync service
- `src/app/api/sync/gsc/route.ts` - API endpoint

**Database:**
- `Document Storage/SQL/gsc_schema.sql` - Database schema

**Documentation:**
- This file: `Document Storage/Documentation/GSC_Integration_Guide.md`

## Next Steps

1. ✅ Create database tables in Supabase
2. ✅ Test manual sync
3. ⏳ Set up daily automation (Vercel Cron)
4. ⏳ Build dashboard components to visualize GSC data
5. ⏳ Create materialized views for common queries

---
**Last Updated:** 2024-11-20
