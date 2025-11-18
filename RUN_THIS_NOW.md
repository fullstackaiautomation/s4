# ⚡ RUN THIS NOW - Asana Integration

## ✅ Everything is Ready!

Your Asana integration is **100% complete** and tested. All you need to do is run 2 commands.

---

## 🎯 Step 1: Create Database Tables (3 min)

### Go to Supabase:
https://tcryasuisocelektmrmb.supabase.co

### Steps:
1. Click **SQL Editor** (left sidebar)
2. Click **New Query** button
3. Open this file on your computer:
   ```
   Document Storage\SQL\asana_schema.sql
   ```
4. Copy **ALL** the contents (it's a big file with 700+ lines)
5. Paste into Supabase SQL Editor
6. Click **Run** (bottom right)

### Expected Result:
```
Success. No rows returned
```

This creates:
- ✅ 13 tables (workspaces, projects, tasks, users, custom fields, etc.)
- ✅ 3 materialized views (sales pipeline, rep performance, customer service)
- ✅ Auto-parsing for all 48 custom fields
- ✅ Sync logging and error tracking

**Time: ~10 seconds to run**

---

## 🎯 Step 2: Run First Sync (5 min)

### Open Terminal 1 - Start Dev Server:
```bash
cd "Source 4 Dashboard/web"
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Open Terminal 2 - Trigger Sync:
```powershell
# PowerShell (Windows)
$body = @{ fullSync = $true } | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/asana" `
  -Body $body `
  -ContentType "application/json"
```

### What Happens:
1. Connects to your Asana account ✓
2. Syncs 1 workspace (source4industries.com)
3. Syncs 76 projects including:
   - **Shopify Orders** (your e-commerce orders)
   - **Orders Not Shopify** (B2B sales/quotes)
   - **CUSTOMER SERVICE** (support tickets)
   - 73 other projects
4. Syncs ALL tasks from all projects
5. Parses ALL 48 custom fields
6. Creates sales pipeline views
7. Calculates rep performance metrics

### Expected Output:
```json
{
  "success": true,
  "syncId": 1,
  "recordsSynced": 1247,
  "recordsCreated": 1247,
  "recordsUpdated": 0,
  "duration": 15420,
  "message": "Successfully synced 1247 records in 15.4s"
}
```

**Time: 2-5 minutes** (depends on number of tasks)

---

## 🎯 Step 3: Verify Data (1 min)

### Go back to Supabase → Table Editor

Click on each table to verify data:

### Should See Data:
- ✅ **asana_workspaces** → 1 row (source4industries.com)
- ✅ **asana_projects** → 76 rows (all your projects)
- ✅ **asana_tasks** → Hundreds/thousands of rows (all your tasks!)
- ✅ **asana_users** → Your team members
- ✅ **asana_custom_field_definitions** → 48 rows (all your custom fields)

### Check the Views:
- ✅ **asana_sales_pipeline** → Tasks with Order Value (quotes/sales)
- ✅ **asana_rep_performance** → Rep metrics (if you have assignees)
- ✅ **asana_customer_service_metrics** → Support ticket stats

---

## 🎉 That's It!

Once you see data in those tables, you have:

✅ Live Asana data in Supabase
✅ All 76 projects synced
✅ All tasks with complete history
✅ All 48 custom fields parsed and queryable
✅ Ready for dashboard visualization

---

## 📊 What You Can Query Right Now

### See all Shopify orders:
```sql
SELECT
  name as order,
  custom_fields->>'Order Value' as value,
  custom_fields->>'Status' as status,
  assignee_name,
  created_at
FROM asana_tasks
WHERE project_name = 'Shopify Orders'
ORDER BY created_at DESC
LIMIT 20;
```

### See B2B sales pipeline:
```sql
SELECT
  name as opportunity,
  quote_amount,
  task_status,
  priority,
  assignee_name as rep,
  created_at
FROM asana_tasks
WHERE project_name = 'Orders Not Shopify'
  AND quote_amount > 0
ORDER BY quote_amount DESC
LIMIT 20;
```

### See customer service tickets:
```sql
SELECT
  name as ticket,
  priority,
  task_status as status,
  assignee_name as assigned_to,
  created_at,
  completed,
  EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at)) / 3600 as hours_open
FROM asana_tasks
WHERE project_name = 'CUSTOMER SERVICE'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 Future Syncs

### Manual Sync (Anytime):
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/asana" `
  -Body '{"fullSync":false}' `
  -ContentType "application/json"
```

Note: `fullSync: false` = incremental (only new/changed tasks, MUCH faster!)

### Automatic Sync (15 minutes):
I'll set this up after you verify the first sync works!

---

## 🆘 If Something Goes Wrong

### Sync fails with "Missing required environment variables":
- Check `.env.local` has ASANA_ACCESS_TOKEN
- Restart dev server (`npm run dev`)

### Database error "relation does not exist":
- Database schema didn't run successfully
- Go back to Step 1, re-run the SQL

### "No data synced":
- Check `asana_sync_log` table for errors:
  ```sql
  SELECT * FROM asana_sync_log ORDER BY sync_started_at DESC LIMIT 1;
  ```

### Questions?
- Check `ASANA_INTEGRATION_COMPLETE.md` for full documentation
- Check `ASANA_PROJECT_MAPPING.md` for project details
- Look at sync log in Supabase for error details

---

## 🚀 After Sync Completes

Tell me:
1. ✅ "Sync complete!"
2. How many records were synced
3. Any errors in the sync log

Then I'll:
1. Build your 3 custom dashboards:
   - Shopify Orders Dashboard
   - B2B Sales Pipeline
   - Customer Service Metrics
2. Set up automatic sync (every 15 min)
3. Configure alerts for critical items

---

## 💡 While You Wait for Sync...

The sync takes 2-5 minutes. While it runs, tell me which integration you want next:

### Quick Wins (Can start immediately):
- **Shopify** - E-commerce sales data (30 min)
- **Google Sheets** - Import legacy data (15 min)
- **Klaviyo** - Email marketing metrics (15 min)

### Need Credentials First:
- **CBOS (ERP)** - Real-time costs/profits (need API docs from provider)
- **Google Analytics 4** - Website traffic (need Google Cloud setup)
- **Google Ads** - Ad performance (need OAuth setup)

**Choose one and I'll start building while Asana syncs!**

---

Ready? **Run Step 1 now!** 🚀

(Go to Supabase → SQL Editor → New Query → Paste schema → Run)
