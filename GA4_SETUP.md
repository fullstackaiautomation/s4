# ⚡ Google Analytics 4 Integration - Setup Guide

## ✅ What's Already Done

- ✅ GA4 client installed (`@google-analytics/data`)
- ✅ Database schema created (`Document Storage/SQL/ga4_schema.sql`)
- ✅ GA4 sync service built
- ✅ API endpoint created (`/api/sync/ga4`)
- ✅ Test script ready
- ✅ Property ID configured: **412702243**

## 🎯 Next Step: Add Service Account Credentials

You need to add the Google Cloud service account JSON credentials to your environment.

### Option 1: Environment Variable (Recommended)

1. Open your downloaded JSON file (e.g., `source-4-industries-ga4-key.json`)
2. Copy the **entire contents** of the file
3. Open `.env.local` in the dashboard web folder
4. Add this line (replace with your actual JSON):

```env
GA4_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"ga4-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important:**
- Keep it all on ONE line
- Wrap in single quotes `'...'`
- Make sure newlines in private_key are `\n` (not actual newlines)

### Option 2: File Path

1. Place your JSON file somewhere safe (NOT in git!)
2. Add to `.env.local`:

```env
GA4_CREDENTIALS_PATH=C:\path\to\your\service-account-key.json
```

Then update `ga4-client.ts` to support `credentialsPath` in the `createGA4Client()` function.

---

## 🧪 Test the Connection

After adding credentials:

```bash
cd "Source 4 Dashboard/web"
npx tsx scripts/test-ga4.ts
```

**Expected output:**
```
🔍 Testing Google Analytics 4 Connection...

📋 Environment Check:
  GA4_PROPERTY_ID: ✅ Set
  GA4_CREDENTIALS_JSON: ✅ Set

🔌 Creating GA4 client...
✅ GA4 client created successfully

🧪 Testing connection to GA4...
✅ Successfully connected to GA4!

📊 Fetching sample traffic data (last 7 days)...
✅ Retrieved 7 days of traffic data

📈 Sample data (most recent day):
  Date: 20250118
  Sessions: 1,234
  Users: 987
  New Users: 456
  Pageviews: 3,456
  Engagement Rate: 65.43%
  Bounce Rate: 34.57%
  Avg Session Duration: 123s

✅ GA4 integration is ready!
```

---

## 🗄️ Create Database Tables

**Step 1:** Go to Supabase SQL Editor
- URL: https://tcryasuisocelektmrmb.supabase.co
- Click **SQL Editor** → **New Query**

**Step 2:** Copy and paste the schema
- Open: `Document Storage/SQL/ga4_schema.sql`
- Copy ALL contents
- Paste into SQL Editor
- Click **Run**

**Expected:** `Success. No rows returned`

This creates:
- ✅ `ga4_daily_traffic` - Daily sessions, users, engagement
- ✅ `ga4_traffic_sources` - Source/medium/campaign data
- ✅ `ga4_page_performance` - Page views and engagement
- ✅ `ga4_ecommerce_transactions` - Transaction data
- ✅ `ga4_ecommerce_items` - Items purchased
- ✅ `ga4_conversions` - Conversion events
- ✅ `ga4_sync_log` - Sync history

---

## 🚀 Run First Sync

**Step 1:** Start dev server

```bash
cd "Source 4 Dashboard/web"
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

**Step 2:** Trigger sync (in new terminal)

```powershell
# Full sync (get all data from 2024-01-01 to today)
$body = @{ fullSync = $true } | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/ga4" `
  -Body $body `
  -ContentType "application/json"
```

**Expected output:**
```json
{
  "success": true,
  "syncId": 1,
  "recordsSynced": 2847,
  "recordsCreated": 2847,
  "recordsUpdated": 0,
  "duration": 12500,
  "message": "Successfully synced 2847 records in 12.5s"
}
```

---

## ✅ Verify Data

Go to Supabase → **Table Editor**:

- `ga4_daily_traffic` → Should see daily metrics!
- `ga4_traffic_sources` → Should see source/medium breakdown!
- `ga4_page_performance` → Should see page analytics!
- `ga4_sync_log` → Check sync status

---

## 🔄 Running Future Syncs

### Incremental Sync (Yesterday's data only)
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/ga4" `
  -Body '{"fullSync":false}' `
  -ContentType "application/json"
```

### Custom Date Range
```powershell
$body = @{
  fullSync = $false
  dateRange = @{
    startDate = "2025-01-01"
    endDate = "2025-01-18"
  }
} | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/ga4" `
  -Body $body `
  -ContentType "application/json"
```

### Selective Sync (Only specific data types)
```powershell
$body = @{
  fullSync = $false
  syncTraffic = $true
  syncSources = $true
  syncPages = $false
  syncEcommerce = $false
  syncConversions = $false
} | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/ga4" `
  -Body $body `
  -ContentType "application/json"
```

---

## 📊 What Data You'll Get

### Daily Traffic
- Sessions, users, new users
- Engaged sessions
- Engagement rate, bounce rate
- Average session duration
- Pageviews

### Traffic Sources
- Source (google, bing, facebook, etc.)
- Medium (organic, cpc, referral, email)
- Campaign name
- Sessions, users, new users by source
- Conversions and revenue by source

### Page Performance
- Page path and title
- Pageviews
- Average time on page
- Bounce rate
- Exit count

### E-commerce
- Transaction ID
- Revenue, tax, shipping
- Items purchased
- Source/medium/campaign attribution

### Conversions
- Event name (purchase, add_to_cart, begin_checkout, generate_lead)
- Conversion count
- Conversion value
- Source/medium/campaign attribution

---

## 🆘 Troubleshooting

### "GA4_CREDENTIALS_JSON not found"
- Check `.env.local` exists and has the credentials
- Restart dev server after adding credentials
- Make sure JSON is on ONE line wrapped in single quotes

### "Failed to parse GA4 credentials"
- JSON might be malformed
- Check that newlines in `private_key` are `\n` (not actual newlines)
- Try pasting JSON into a JSON validator first

### "Service account does not have access"
- Go to Google Analytics → Admin → Property Access Management
- Click "Add users"
- Add your service account email (from the JSON file)
- Give it "Viewer" role

### "No data synced"
- Check `ga4_sync_log` table for errors
- Your property might not have data for the date range
- Try a smaller date range first (last 7 days)

---

## ✅ Success Checklist

- [ ] Service account JSON added to `.env.local`
- [ ] Test script runs successfully (`npx tsx scripts/test-ga4.ts`)
- [ ] Database schema created in Supabase
- [ ] Dev server running
- [ ] First sync completed successfully
- [ ] Data visible in Supabase tables

---

## 🎉 Next Steps

Once GA4 is syncing, we'll:

1. **Build GA4 dashboard** showing:
   - Traffic trends (sessions, users, pageviews)
   - Top traffic sources
   - Top pages
   - E-commerce performance
   - Conversion funnel

2. **Set up automatic sync** (every hour or daily)

3. **Move to next integration**: Google Sheets

---

Ready? **Add your credentials and run the test!** 🚀
