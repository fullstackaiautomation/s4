# Live Data Integration Plan - Source 4 Industries Dashboard

**Goal:** Connect all business data sources to enable real-time dashboard updates and business intelligence.

---

## 📋 Integration Priority Tiers

### 🔥 Tier 1: Critical (Implement First - Highest ROI)
These integrations will provide the most immediate value and are foundational for other features.

1. **Asana** - Operations & Sales Tracking
2. **CBOS (ERP)** - Real-time Sales, Costs & P&L
3. **Shopify** - E-commerce Sales Data
4. **Google Analytics 4** - Website Traffic & Conversions

### ⚡ Tier 2: High Priority (Implement Within 30 Days)
5. **Google Ads** - Advertising Performance
6. **Bing Ads** - Advertising Performance
7. **Klaviyo** - Email Marketing Analytics
8. **Google Sheets** - Legacy Data Integration

### 🎯 Tier 3: Medium Priority (Implement Within 60 Days)
9. **Attentive** - SMS Marketing Analytics
10. **Google Search Console** - SEO & Search Data
11. **Google Merchant Center** - Product Feed Performance
12. **CallRail** - Phone Call Tracking

### 🔮 Tier 4: Nice to Have (Implement When Ready)
13. **Zapier** - Automation Monitoring
14. **n8n** - Automation Monitoring
15. **Bing Search** - Bing SEO Data
16. **Google Drive** - Document Management
17. **Google "Nano Banana"** - Product Image Generation (verify this tool exists)

---

## 🎯 Tier 1 Integrations - Critical Path

## 1. 🎯 ASANA - Operations & Sales Hub

**Impact:** MOST IMPORTANT - Your entire sales process lives here
**Complexity:** Medium
**Implementation Time:** 1-2 weeks

### What You Need to Tell Asana/Collect:

#### A. Create Asana API Access
1. Log into Asana: https://app.asana.com
2. Click your profile photo → **Settings** → **Apps** → **Developer Apps**
3. Click **"Create New Personal Access Token"**
4. Name it: "Source 4 Dashboard Integration"
5. Copy the token (starts with `1/...`)

#### B. Identify Your Workspaces & Projects
Run this after getting your token to see your structure:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://app.asana.com/api/1.0/workspaces
```

#### C. Define What Data to Track
Tell me which Asana projects contain:
- **Quotes** (project ID or name)
- **Customer Service Issues** (project ID or name)
- **Freight Calculator Issues** (project ID or name)
- **Sales Tracking** (project ID or name)
- **Follow-up Performance** (project ID or name)

#### D. Custom Fields to Track
Asana custom fields we'll need to map:
- Quote Amount ($)
- Customer Name (text)
- Close Probability (%)
- Status (dropdown: Open, Won, Lost, Follow-up)
- Rep Name (text or person field)
- Follow-up Date (date)
- Deal Close Date (date)
- Notes (description)

### What I'll Build:

**Database Tables:**
```sql
-- Asana Tasks (Quotes, Customer Service, etc.)
CREATE TABLE asana_tasks (
  id TEXT PRIMARY KEY,
  gid TEXT UNIQUE,
  name TEXT,
  notes TEXT,
  project_name TEXT,
  project_gid TEXT,
  assignee_name TEXT,
  assignee_gid TEXT,
  due_date TIMESTAMP,
  completed BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  modified_at TIMESTAMP,
  custom_fields JSONB, -- All custom fields
  tags TEXT[],
  -- Parsed fields from custom fields
  quote_amount NUMERIC,
  customer_name TEXT,
  close_probability NUMERIC,
  task_status TEXT,
  rep_name TEXT,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Asana Projects
CREATE TABLE asana_projects (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE,
  name TEXT,
  workspace_gid TEXT,
  archived BOOLEAN,
  created_at TIMESTAMP,
  modified_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Asana Sync Log
CREATE TABLE asana_sync_log (
  id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMP,
  sync_completed_at TIMESTAMP,
  records_synced INTEGER,
  errors TEXT[],
  status TEXT -- 'success', 'partial', 'failed'
);
```

**Dashboard Features:**
- **Sales Pipeline View**: Visual pipeline of all quotes by stage
- **Rep Performance**: Close rates, follow-up speed, deal size by rep
- **Customer Service Metrics**: Response time, resolution rate, issue types
- **Freight Calculator Issues**: Track and resolve calculation problems
- **Follow-up Tracking**: Overdue tasks, response times, conversion rates

**Sync Schedule:** Every 15 minutes (Asana API allows 1500 requests/min)

---

## 2. 💼 CBOS (ERP) - Real-time Financial Data

**Impact:** Critical - Source of truth for costs, profits, inventory
**Complexity:** High (depends on their API)
**Implementation Time:** 2-3 weeks

### What You Need from CBOS Provider:

**Email your CBOS account manager with this request:**

```
Subject: API Access Request for Source 4 Dashboard Integration

Hello [CBOS Contact],

We need API access to pull data for our business intelligence dashboard.
Please provide the following:

1. API Documentation
   - Full API documentation URL or PDF
   - Authentication method (API Key, OAuth, etc.)
   - Rate limits and usage restrictions

2. API Credentials
   - Production API endpoint URL
   - API Key or OAuth credentials
   - Webhook support (if available for real-time updates)

3. Data Access Permissions
   We need READ-ONLY access to the following data:

   A. Sales Orders (Real-time)
      - Order number, date, customer
      - Line items (SKU, quantity, unit price, total)
      - Order status (pending, shipped, delivered, cancelled)
      - Sales rep assigned
      - Shipping information

   B. Product Costs & Inventory
      - SKU
      - Current cost (wholesale/landed cost)
      - Retail price
      - On-hand quantity
      - Location/warehouse
      - Supplier information

   C. Profit & Loss Data
      - Revenue by SKU, customer, rep, date
      - Cost of goods sold
      - Gross profit & margin
      - Operating expenses (if available)

   D. Customer Data
      - Customer ID, name, company
      - Contact information
      - Customer type (B2B, B2C, wholesale, etc.)
      - Lifetime value
      - Payment terms

   E. Purchase Orders (if available)
      - PO number, date, supplier
      - Expected delivery date
      - Line items and costs

4. Sync Frequency
   - Can we poll the API every 15 minutes for updates?
   - Do you support webhooks for real-time push notifications?
   - Any restrictions on number of API calls per hour/day?

5. Test Environment
   - Test/sandbox API credentials for development
   - Sample data structure (JSON/XML examples)

Please provide estimated timeline for API access provisioning.

Best regards,
[Your Name]
Source 4 Industries
```

### What I'll Build (Once We Get API Access):

**Database Tables:**
```sql
-- CBOS Orders (real-time sales)
CREATE TABLE cbos_orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE,
  order_date TIMESTAMP,
  customer_id TEXT,
  customer_name TEXT,
  rep_name TEXT,
  order_status TEXT, -- pending, shipped, delivered, cancelled
  subtotal NUMERIC,
  tax NUMERIC,
  shipping_cost NUMERIC,
  total_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- CBOS Order Line Items
CREATE TABLE cbos_order_lines (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES cbos_orders(id),
  order_number TEXT,
  line_number INTEGER,
  sku TEXT,
  description TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  unit_cost NUMERIC, -- wholesale cost
  line_total NUMERIC,
  line_profit NUMERIC, -- calculated: (unit_price - unit_cost) * quantity
  margin_percent NUMERIC -- calculated: line_profit / line_total
);

-- CBOS Product Costs (real-time cost tracking)
CREATE TABLE cbos_product_costs (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  description TEXT,
  current_cost NUMERIC,
  retail_price NUMERIC,
  on_hand_quantity NUMERIC,
  warehouse_location TEXT,
  supplier_name TEXT,
  last_cost_update TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- CBOS Customers
CREATE TABLE cbos_customers (
  id SERIAL PRIMARY KEY,
  customer_id TEXT UNIQUE,
  customer_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  customer_type TEXT, -- B2B, B2C, wholesale
  payment_terms TEXT,
  credit_limit NUMERIC,
  lifetime_value NUMERIC,
  created_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- **Real-time Sales Feed**: Live order updates as they come in
- **Cost Alerts**: Notifications when product costs change significantly
- **Margin Tracking**: Live profit margin by product, customer, rep
- **Inventory Levels**: Low stock alerts, reorder recommendations
- **Customer Insights**: Purchase frequency, average order value, lifetime value

**Sync Schedule:** Every 15 minutes (or webhooks if available for instant updates)

---

## 3. 🛒 SHOPIFY - E-commerce Sales Data

**Impact:** High - Tracks all online sales
**Complexity:** Low (excellent API)
**Implementation Time:** 3-5 days

### What You Need to Collect:

#### A. Create Shopify Private App (or Custom App)
1. Log into Shopify Admin: https://[your-store].myshopify.com/admin
2. Go to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **"Create an app"**
4. Name it: "Source 4 Dashboard Integration"
5. Click **"Configure Admin API scopes"** and enable:
   - `read_orders` - Read orders
   - `read_products` - Read products
   - `read_customers` - Read customers
   - `read_analytics` - Read analytics
   - `read_inventory` - Read inventory levels
   - `read_marketing_events` - Read marketing data
6. Click **"Install app"** and copy:
   - **Admin API access token** (starts with `shpat_...`)
   - **Shop domain** (e.g., `source4industries.myshopify.com`)

### What I'll Build:

**Database Tables:**
```sql
-- Shopify Orders
CREATE TABLE shopify_orders (
  id BIGINT PRIMARY KEY,
  order_number TEXT,
  order_name TEXT, -- e.g., #1001
  email TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  closed_at TIMESTAMP,
  currency TEXT,
  current_total_price NUMERIC,
  current_subtotal_price NUMERIC,
  total_discounts NUMERIC,
  total_line_items_price NUMERIC,
  total_tax NUMERIC,
  total_shipping NUMERIC,
  financial_status TEXT, -- paid, pending, refunded
  fulfillment_status TEXT, -- fulfilled, partial, unfulfilled
  customer_id BIGINT,
  customer_name TEXT,
  tags TEXT[],
  source_name TEXT, -- web, pos, mobile
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Shopify Order Line Items
CREATE TABLE shopify_order_lines (
  id BIGINT PRIMARY KEY,
  order_id BIGINT REFERENCES shopify_orders(id),
  product_id BIGINT,
  variant_id BIGINT,
  title TEXT,
  variant_title TEXT,
  sku TEXT,
  quantity INTEGER,
  price NUMERIC,
  total_discount NUMERIC,
  vendor TEXT,
  product_type TEXT
);

-- Shopify Products
CREATE TABLE shopify_products (
  id BIGINT PRIMARY KEY,
  title TEXT,
  vendor TEXT,
  product_type TEXT,
  tags TEXT[],
  status TEXT, -- active, draft, archived
  published_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Shopify Analytics (aggregated)
CREATE TABLE shopify_analytics_daily (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE,
  total_sales NUMERIC,
  total_orders INTEGER,
  average_order_value NUMERIC,
  returning_customer_rate NUMERIC,
  online_store_sessions INTEGER,
  online_store_conversion_rate NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- **Sales Dashboard**: Real-time Shopify sales vs CBOS comparison
- **Product Performance**: Top Shopify products vs internal catalog
- **Customer Segmentation**: New vs returning, lifetime value
- **Conversion Funnel**: Sessions → cart → checkout → purchase

**Sync Schedule:** Every 15 minutes

---

## 4. 📊 GOOGLE ANALYTICS 4 - Website Traffic & Attribution

**Impact:** High - Understand where sales come from
**Complexity:** Medium
**Implementation Time:** 1 week

### What You Need to Collect:

#### A. Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Click **"Create Project"** → Name it "Source 4 Dashboard"
3. Enable **Google Analytics Data API**:
   - Go to **APIs & Services** → **Library**
   - Search "Google Analytics Data API"
   - Click **Enable**

#### B. Create Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Name: "source4-dashboard-ga4"
4. Click **Create and Continue**
5. Click **Done**
6. Click on the service account you just created
7. Go to **Keys** tab → **Add Key** → **Create new key** → **JSON**
8. Download the JSON file and save it securely

#### C. Grant Analytics Access
1. Copy the service account email (looks like: `source4-dashboard-ga4@...gserviceaccount.com`)
2. Go to Google Analytics: https://analytics.google.com/
3. Click **Admin** (bottom left) → **Property** → **Property Access Management**
4. Click **+** → **Add users**
5. Paste the service account email
6. Give it **"Viewer"** role
7. Click **Add**

#### D. Get Your Property ID
1. In Google Analytics, go to **Admin** → **Property Settings**
2. Copy your **Property ID** (looks like: `123456789`)

### What I'll Build:

**Database Tables:**
```sql
-- GA4 Daily Traffic
CREATE TABLE ga4_daily_traffic (
  id SERIAL PRIMARY KEY,
  date DATE,
  sessions INTEGER,
  users INTEGER,
  new_users INTEGER,
  engaged_sessions INTEGER,
  engagement_rate NUMERIC,
  bounce_rate NUMERIC,
  average_session_duration NUMERIC, -- seconds
  pageviews INTEGER,
  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date)
);

-- GA4 Traffic Sources
CREATE TABLE ga4_traffic_sources (
  id SERIAL PRIMARY KEY,
  date DATE,
  source TEXT, -- google, bing, direct, facebook
  medium TEXT, -- organic, cpc, referral, email
  campaign TEXT,
  sessions INTEGER,
  users INTEGER,
  conversions INTEGER,
  conversion_rate NUMERIC,
  revenue NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- GA4 Page Performance
CREATE TABLE ga4_page_performance (
  id SERIAL PRIMARY KEY,
  date DATE,
  page_path TEXT,
  page_title TEXT,
  pageviews INTEGER,
  unique_pageviews INTEGER,
  avg_time_on_page NUMERIC,
  bounce_rate NUMERIC,
  exits INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- GA4 E-commerce
CREATE TABLE ga4_ecommerce (
  id SERIAL PRIMARY KEY,
  date DATE,
  transaction_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  item_name TEXT,
  item_category TEXT,
  item_revenue NUMERIC,
  quantity INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- GA4 Goal Conversions
CREATE TABLE ga4_conversions (
  id SERIAL PRIMARY KEY,
  date DATE,
  conversion_event TEXT, -- purchase, add_to_cart, begin_checkout
  source TEXT,
  medium TEXT,
  conversions INTEGER,
  conversion_value NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- **Traffic Overview**: Daily sessions, users, engagement
- **Acquisition Report**: Which channels drive the most sales
- **Landing Page Performance**: Best converting pages
- **Customer Journey**: Multi-touch attribution modeling
- **Blog Performance Integration**: Track blog post traffic + conversions

**Sync Schedule:** Daily (GA4 data has 24-48hr latency)

---

## ⚡ Tier 2 Integrations - High Priority

## 5. 📢 GOOGLE ADS - Advertising Performance

**Impact:** High - Track advertising ROI
**Complexity:** Medium-High
**Implementation Time:** 1 week

### What You Need to Collect:

#### A. Same Google Cloud Project as GA4
Use the same project from GA4 setup above.

#### B. Enable Google Ads API
1. In Google Cloud Console: https://console.cloud.google.com/
2. Go to **APIs & Services** → **Library**
3. Search "Google Ads API"
4. Click **Enable**

#### C. Get Google Ads Developer Token
1. Go to Google Ads: https://ads.google.com/
2. Click **Tools & Settings** → **Setup** → **API Center**
3. Click **Apply for Basic Access** (if you haven't already)
4. Copy your **Developer Token**

#### D. OAuth 2.0 Setup
1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Source 4 Dashboard Google Ads"
5. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Download the **Client ID** and **Client Secret**

#### E. Get Customer ID
1. In Google Ads, top right corner shows your Customer ID
2. Format: `123-456-7890` (use without dashes: `1234567890`)

### What I'll Build:

**Database Tables:**
```sql
-- Google Ads Campaigns
CREATE TABLE google_ads_campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id BIGINT UNIQUE,
  campaign_name TEXT,
  campaign_status TEXT, -- ENABLED, PAUSED, REMOVED
  campaign_type TEXT, -- SEARCH, SHOPPING, DISPLAY
  start_date DATE,
  end_date DATE,
  budget_amount NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Google Ads Performance (daily)
CREATE TABLE google_ads_performance (
  id SERIAL PRIMARY KEY,
  date DATE,
  campaign_id BIGINT,
  campaign_name TEXT,
  ad_group_name TEXT,
  impressions INTEGER,
  clicks INTEGER,
  cost NUMERIC, -- in dollars
  conversions NUMERIC,
  conversion_value NUMERIC,
  ctr NUMERIC, -- click-through rate
  cpc NUMERIC, -- cost per click
  cpa NUMERIC, -- cost per acquisition
  roas NUMERIC, -- return on ad spend
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Google Ads Product Performance (Shopping)
CREATE TABLE google_ads_products (
  id SERIAL PRIMARY KEY,
  date DATE,
  campaign_id BIGINT,
  campaign_name TEXT,
  product_id TEXT, -- SKU
  product_title TEXT,
  impressions INTEGER,
  clicks INTEGER,
  cost NUMERIC,
  conversions NUMERIC,
  conversion_value NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Google Ads Keywords
CREATE TABLE google_ads_keywords (
  id SERIAL PRIMARY KEY,
  date DATE,
  campaign_id BIGINT,
  ad_group_name TEXT,
  keyword TEXT,
  match_type TEXT, -- EXACT, PHRASE, BROAD
  impressions INTEGER,
  clicks INTEGER,
  cost NUMERIC,
  conversions NUMERIC,
  quality_score INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- **Campaign Performance**: Cost, conversions, ROAS by campaign
- **Product Ad Spend Dashboard**: Enhanced with real-time Google Ads data
- **Keyword Analysis**: Best performing keywords by ROI
- **Budget Pacing**: Track daily spend vs budget
- **Cross-Platform Attribution**: Google Ads + Shopify + GA4 combined view

**Sync Schedule:** Every hour (API has strict rate limits)

---

## 6. 📢 BING ADS - Advertising Performance

**Impact:** Medium-High - Track Bing advertising ROI
**Complexity:** Medium
**Implementation Time:** 3-4 days

### What You Need to Collect:

#### A. Get Bing Ads Developer Token
1. Go to: https://developers.ads.microsoft.com/
2. Sign in with your Microsoft account
3. Go to **Account** → **Request Token**
4. Fill out application (usually approved within 24 hours)
5. Copy your **Developer Token**

#### B. Get API Credentials
1. Go to: https://apps.dev.microsoft.com/
2. Click **Add an app**
3. Name: "Source 4 Dashboard Bing Ads"
4. Copy **Application ID** (Client ID)
5. Click **Generate New Password** → Copy **Client Secret**

#### C. Get Account IDs
1. Log into Bing Ads: https://ads.microsoft.com/
2. Top right → Account summary
3. Copy your **Account ID** and **Customer ID**

### What I'll Build:

**Database Tables:**
```sql
-- Bing Ads Campaigns
CREATE TABLE bing_ads_campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id BIGINT UNIQUE,
  campaign_name TEXT,
  campaign_status TEXT, -- Active, Paused, Deleted
  campaign_type TEXT, -- Search, Shopping, Audience
  budget_amount NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Bing Ads Performance (daily)
CREATE TABLE bing_ads_performance (
  id SERIAL PRIMARY KEY,
  date DATE,
  campaign_id BIGINT,
  campaign_name TEXT,
  impressions INTEGER,
  clicks INTEGER,
  spend NUMERIC,
  conversions INTEGER,
  revenue NUMERIC,
  ctr NUMERIC,
  cpc NUMERIC,
  roas NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Bing Ads Products (Shopping)
CREATE TABLE bing_ads_products (
  id SERIAL PRIMARY KEY,
  date DATE,
  campaign_id BIGINT,
  product_id TEXT,
  product_title TEXT,
  impressions INTEGER,
  clicks INTEGER,
  spend NUMERIC,
  conversions INTEGER,
  revenue NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- Combined Google + Bing Ads dashboard
- Cross-platform product performance comparison
- Unified ROAS tracking

**Sync Schedule:** Every hour

---

## 7. 📧 KLAVIYO - Email Marketing Analytics

**Impact:** Medium-High - Track email campaign performance
**Complexity:** Low (great API)
**Implementation Time:** 2-3 days

### What You Need to Collect:

#### A. Get Klaviyo API Key
1. Log into Klaviyo: https://www.klaviyo.com/
2. Click **Account** (bottom left) → **Settings** → **API Keys**
3. Click **Create Private API Key**
4. Name: "Source 4 Dashboard"
5. Permissions: **Read-Only** access to:
   - Campaigns
   - Flows
   - Metrics
   - Lists
6. Copy the **Private API Key** (starts with `pk_...`)

### What I'll Build:

**Database Tables:**
```sql
-- Klaviyo Campaigns (blast emails)
CREATE TABLE klaviyo_campaigns (
  id TEXT PRIMARY KEY,
  campaign_name TEXT,
  subject_line TEXT,
  send_time TIMESTAMP,
  campaign_type TEXT, -- email, sms
  status TEXT, -- Sent, Draft, Scheduled
  sent_count INTEGER,
  open_count INTEGER,
  click_count INTEGER,
  open_rate NUMERIC,
  click_rate NUMERIC,
  unsubscribe_count INTEGER,
  revenue NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Klaviyo Flows (automated journeys)
CREATE TABLE klaviyo_flows (
  id TEXT PRIMARY KEY,
  flow_name TEXT,
  status TEXT, -- Live, Draft, Manual
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Klaviyo Flow Messages
CREATE TABLE klaviyo_flow_messages (
  id TEXT PRIMARY KEY,
  flow_id TEXT REFERENCES klaviyo_flows(id),
  flow_name TEXT,
  message_name TEXT,
  sent_count INTEGER,
  open_count INTEGER,
  click_count INTEGER,
  revenue NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Klaviyo Daily Performance
CREATE TABLE klaviyo_daily_performance (
  id SERIAL PRIMARY KEY,
  date DATE,
  emails_sent INTEGER,
  emails_opened INTEGER,
  emails_clicked INTEGER,
  revenue NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC,
  synced_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date)
);
```

**Dashboard Features:**
- **Email Performance**: Campaign stats, flow performance
- **Lifecycle Dashboard**: Journey metrics (welcome, post-purchase, win-back)
- **Revenue Attribution**: Email-driven revenue
- **List Health**: Growth, engagement, churn rates

**Sync Schedule:** Every 6 hours

---

## 8. 📊 GOOGLE SHEETS - Legacy Data Access

**Impact:** Medium - Access existing tracking sheets
**Complexity:** Low
**Implementation Time:** 1-2 days

### What You Need to Collect:

#### A. Use Same Google Cloud Service Account from GA4
The service account you created for GA4 will work here too.

#### B. Enable Google Sheets API
1. In Google Cloud Console: https://console.cloud.google.com/
2. Go to **APIs & Services** → **Library**
3. Search "Google Sheets API"
4. Click **Enable**

#### C. Share Sheets with Service Account
For each Google Sheet you want to access:
1. Open the sheet
2. Click **Share**
3. Add the service account email (from GA4 setup)
4. Give it **Viewer** access
5. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

#### D. Send Me a List of Sheets
Create a list with:
- Sheet Name / Purpose
- Sheet ID
- Which tab/range to read (e.g., "Sheet1!A1:Z1000")
- Update frequency needed (e.g., daily, weekly)

### What I'll Build:

**Database Tables:**
```sql
-- Google Sheets Data (generic structure)
CREATE TABLE google_sheets_data (
  id SERIAL PRIMARY KEY,
  sheet_id TEXT,
  sheet_name TEXT,
  tab_name TEXT,
  row_number INTEGER,
  data JSONB, -- flexible column storage
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Parsed legacy tracking data (example)
CREATE TABLE legacy_sales_tracking (
  id SERIAL PRIMARY KEY,
  date DATE,
  rep_name TEXT,
  customer TEXT,
  amount NUMERIC,
  status TEXT,
  source_sheet TEXT,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

**Dashboard Features:**
- Import historical data to fill gaps
- One-time migration of legacy tracking
- Periodic sync for sheets still in use

**Sync Schedule:** Daily or on-demand

---

## 🎯 Tier 3 & 4 Integrations - Summary

I'll provide detailed setup guides for these once we complete Tier 1 & 2, but here's what you need:

### 9. Attentive (SMS)
- API Key from Attentive dashboard
- Similar to Klaviyo integration

### 10. Google Search Console
- Use same Google Cloud service account
- Add property to Search Console

### 11. Google Merchant Center
- Use same Google Cloud service account
- Merchant Center ID

### 12. CallRail
- API Token from CallRail account
- Company ID

### 13-17. Others
- Zapier: Webhook URLs + API key
- n8n: API endpoint + credentials
- Bing Search: Not a standard product (verify)
- Google Drive: Same service account, enable Drive API
- Google "Nano Banana": Need to verify this product exists

---

## 📦 Implementation Architecture

### Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                             │
├─────────────────────────────────────────────────────────────┤
│  Asana │ CBOS │ Shopify │ GA4 │ Google Ads │ Bing │ Klaviyo│
└────┬────────┬────────┬──────┬──────────┬───────┬──────┬────┘
     │        │        │      │          │       │      │
     └────────┴────────┴──────┴──────────┴───────┴──────┘
                          │
                     ┌────▼─────┐
                     │  Sync    │
                     │  Service │  ← Node.js API
                     │  Layer   │
                     └────┬─────┘
                          │
                     ┌────▼─────┐
                     │ Supabase │
                     │ Database │
                     └────┬─────┘
                          │
                     ┌────▼──────┐
                     │ Next.js   │
                     │ Dashboard │
                     └───────────┘
```

### Technology Stack

**Sync Service (New):**
- **Runtime**: Node.js with TypeScript
- **Scheduler**: `node-cron` for scheduled syncs
- **API Clients**: Official SDKs where available
- **Error Handling**: Retry logic, error logging to Supabase
- **Deployment**: Vercel Cron Jobs (or separate Node.js server)

**Database:**
- **Supabase PostgreSQL** (already in use)
- New tables for each integration (defined above)
- Views for cross-platform analytics

**Dashboard:**
- **Next.js 15** (already in use)
- New dashboard pages for each data source
- Real-time updates with Supabase Realtime

---

## 🚀 Getting Started - Your Action Items

### Phase 1: Asana + CBOS (Weeks 1-3)

#### Week 1: Asana Setup
**Your Tasks:**
1. [ ] Create Asana Personal Access Token (5 minutes)
2. [ ] Document which Asana projects track:
   - Quotes
   - Customer service
   - Freight issues
   - Sales tracking
3. [ ] List custom fields used in those projects
4. [ ] Share token with me (securely)

**My Tasks:**
- Build Asana sync service
- Create database tables
- Build Asana dashboards

#### Week 2: CBOS Setup
**Your Tasks:**
1. [ ] Email CBOS provider with API request (template above)
2. [ ] Follow up daily until you get:
   - API documentation
   - Test credentials
   - Production credentials
3. [ ] Share API docs + credentials with me

**My Tasks:**
- Review CBOS API documentation
- Build CBOS sync service
- Create real-time sales dashboard

#### Week 3: Testing & Refinement
**Your Tasks:**
1. [ ] Test Asana sync - verify data accuracy
2. [ ] Test CBOS sync - verify sales match your ERP
3. [ ] Provide feedback on dashboards

**My Tasks:**
- Fix bugs
- Add requested features
- Optimize sync performance

### Phase 2: Shopify + GA4 (Weeks 4-5)

**Your Tasks:**
1. [ ] Create Shopify Private App (15 minutes)
2. [ ] Set up Google Cloud project + GA4 access (30 minutes)
3. [ ] Share credentials

**My Tasks:**
- Build Shopify sync
- Build GA4 sync
- Create unified analytics dashboard

### Phase 3: Ad Platforms + Klaviyo (Weeks 6-7)

**Your Tasks:**
1. [ ] Set up Google Ads API access
2. [ ] Set up Bing Ads API access
3. [ ] Get Klaviyo API key
4. [ ] Share credentials

**My Tasks:**
- Build ad platform syncs
- Build Klaviyo sync
- Create marketing performance dashboard

### Phase 4: Remaining Integrations (Weeks 8-10)

**Your Tasks:**
1. [ ] Set up remaining integrations based on priority
2. [ ] Share credentials as you get them

**My Tasks:**
- Build remaining syncs
- Create comprehensive dashboards
- Final testing & optimization

---

## 📊 Expected Outcomes

### After Phase 1 (Asana + CBOS):
✅ Real-time sales pipeline visibility
✅ Accurate cost and profit data
✅ Rep performance tracking
✅ Customer service metrics

### After Phase 2 (Shopify + GA4):
✅ E-commerce performance tracking
✅ Website traffic attribution
✅ Customer journey analysis
✅ Multi-channel sales view

### After Phase 3 (Ads + Email):
✅ Complete marketing ROI
✅ Advertising performance optimization
✅ Email campaign effectiveness
✅ Cross-channel attribution

### After Phase 4 (Everything):
✅ **360° business intelligence**
✅ **Real-time decision making**
✅ **Automated reporting**
✅ **Predictive analytics ready**

---

## 💰 Cost Estimate

### API Usage Costs (Monthly)
- **Asana**: Free (1500 requests/min)
- **CBOS**: Unknown (usually included)
- **Shopify**: Free (2 requests/sec)
- **Google Ads**: Free (15,000 requests/day)
- **Bing Ads**: Free
- **Klaviyo**: Free (rate limits apply)
- **GA4**: Free (200,000 requests/day)
- **Google Sheets**: Free (100 requests/100 sec)

### Infrastructure Costs
- **Supabase Database**: Current plan + ~$25/month for storage growth
- **Vercel Hosting**: Free tier (current) or Pro ($20/month) if needed
- **Sync Service**: Can run on Vercel Cron (free) or separate server (~$10-20/month)

**Total Estimated Cost: $25-65/month** (beyond current hosting)

---

## 🛡️ Security Considerations

1. **API Keys**: Store in Supabase secrets, never in code
2. **Service Accounts**: Use read-only access wherever possible
3. **Data Encryption**: All API credentials encrypted at rest
4. **Rate Limiting**: Respect all API rate limits to avoid bans
5. **Error Logging**: Log sync errors but never log credentials
6. **Access Control**: Row Level Security in Supabase for sensitive data

---

## 📞 Next Steps

**Ready to start? Here's what to do:**

1. **Review this plan** - Any questions or changes needed?
2. **Start with Asana** - Get that Personal Access Token
3. **Email CBOS** - Use the template to request API access
4. **Share credentials securely** - Use environment variables or secure notes

I'll build the integration infrastructure as you collect the credentials. We can work in parallel to move fast!

**Questions to answer:**
- Which integration is MOST critical to start with? (My vote: Asana + CBOS)
- What's your target timeline? (Aggressive: 6 weeks, Comfortable: 10 weeks)
- Any integrations on this list you don't actually need?
- Any integrations MISSING from this list?

Let me know when you're ready to start! 🚀