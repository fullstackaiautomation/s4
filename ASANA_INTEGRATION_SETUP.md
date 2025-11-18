# Asana Integration Setup Guide

## ✅ Status: Ready to Test!

You have successfully provided the Asana token. Here's what has been set up and what to do next.

---

## 🎯 What's Been Built

### 1. Database Schema ✅
**Location:** `Document Storage/SQL/asana_schema.sql`

**Tables created:**
- `asana_workspaces` - Your Asana workspaces
- `asana_projects` - All projects in workspaces
- `asana_users` - Team members
- `asana_tasks` - Tasks with full details + custom fields
- `asana_custom_field_definitions` - Field definitions
- `asana_task_stories` - Comments and activity
- `asana_sync_log` - Sync history and errors

**Materialized Views:**
- `asana_sales_pipeline` - Sales/quotes aggregated view
- `asana_rep_performance` - Rep metrics (close rate, pipeline, etc.)
- `asana_customer_service_metrics` - Support ticket metrics

### 2. API Client ✅
**Location:** `Source 4 Dashboard/web/src/lib/integrations/asana-client.ts`

Handles all Asana API calls with proper types.

### 3. Sync Service ✅
**Location:** `Source 4 Dashboard/web/src/lib/integrations/asana-sync.ts`

Syncs all Asana data to Supabase automatically.

### 4. API Endpoint ✅
**Location:** `Source 4 Dashboard/web/src/app/api/sync/asana/route.ts`

Trigger syncs via HTTP POST.

### 5. Test Script ✅
**Location:** `Source 4 Dashboard/web/scripts/test-asana-connection.ts`

Tests connection and shows your Asana data.

---

## 🚀 Next Steps (15 minutes)

### Step 1: Test the Connection (2 minutes)

```bash
cd "Source 4 Dashboard/web"
npx tsx scripts/test-asana-connection.ts
```

This will:
- ✅ Verify your token works
- 📂 Show your workspaces
- 📋 List your projects
- 📝 Show sample tasks
- 🔧 Display custom fields

**Expected output:**
```
✅ Connected successfully!

👤 Authenticated User:
   Name: [Your Name]
   Email: [Your Email]

📁 Found X workspace(s):
   📂 Source 4 Industries (12345...)
      Found X projects:
         📋 Sales Pipeline
         📋 Customer Service
         ...
```

### Step 2: Run Database Schema (3 minutes)

1. Go to Supabase dashboard: https://tcryasuisocelektmrmb.supabase.co
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open `Document Storage/SQL/asana_schema.sql`
5. Copy ALL the SQL code
6. Paste into Supabase SQL Editor
7. Click **Run** (bottom right)

**Expected result:**
```
Success. No rows returned
```

This creates all 13 tables + views + functions needed for Asana integration.

### Step 3: Run Your First Sync (5 minutes)

Start your dev server:
```bash
cd "Source 4 Dashboard/web"
npm run dev
```

In a new terminal, trigger the sync:
```bash
curl -X POST http://localhost:3000/api/sync/asana \
  -H "Content-Type: application/json" \
  -d '{"fullSync": true}'
```

Or use PowerShell:
```powershell
$body = @{ fullSync = $true } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/sync/asana" -Body $body -ContentType "application/json"
```

**What happens:**
1. ✅ Fetches all workspaces
2. ✅ Fetches all users
3. ✅ Fetches all custom field definitions
4. ✅ Fetches all projects
5. ✅ Fetches all tasks from all projects
6. ✅ Parses custom fields into typed columns
7. ✅ Refreshes materialized views

**Expected output:**
```json
{
  "success": true,
  "syncId": 1,
  "recordsSynced": 450,
  "recordsCreated": 450,
  "recordsUpdated": 0,
  "duration": 12500,
  "message": "Successfully synced 450 records in 12.5s"
}
```

### Step 4: Verify Data in Supabase (2 minutes)

Go back to Supabase dashboard → **Table Editor**

Check these tables have data:
- ✅ `asana_workspaces` (should have 1-2 rows)
- ✅ `asana_projects` (your projects)
- ✅ `asana_tasks` (all your tasks)
- ✅ `asana_users` (your team)

Click on `asana_sales_pipeline` view to see parsed sales data!

### Step 5: Check What Was Synced (3 minutes)

Run this SQL in Supabase to see summary:

```sql
-- Summary of sync
SELECT
  COUNT(*) FILTER (WHERE completed = false) as open_tasks,
  COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
  COUNT(*) FILTER (WHERE quote_amount IS NOT NULL) as quotes,
  SUM(quote_amount) FILTER (WHERE completed = false) as open_pipeline_value,
  COUNT(DISTINCT assignee_name) as reps,
  COUNT(DISTINCT project_name) as projects
FROM asana_tasks;

-- Sales pipeline summary
SELECT
  deal_status,
  COUNT(*) as count,
  SUM(quote_amount)::NUMERIC(10,2) as total_value,
  AVG(close_probability)::NUMERIC(5,1) as avg_probability
FROM asana_sales_pipeline
GROUP BY deal_status
ORDER BY total_value DESC;

-- Rep performance
SELECT * FROM asana_rep_performance;
```

---

## 📊 Custom Field Mapping

The sync automatically parses these custom field names (case-insensitive):

### For Sales/Quotes:
- **Quote Amount** / Deal Value / Amount → `quote_amount` (numeric)
- **Customer Name** / Customer / Company → `customer_name` (text)
- **Close Probability** / Probability → `close_probability` (numeric)
- **Status** / Deal Status → `task_status` (text)
- **Stage** / Deal Stage → `deal_stage` (text)
- **Sales Rep** / Rep → `rep_name` (text)

### To Add More Mappings:

Edit the trigger function in `asana_schema.sql`:

```sql
-- Add your custom field mapping
NEW.your_field_name := COALESCE(
  NEW.custom_fields->'Your Field Name'->>'text_value',
  NEW.your_field_name
);
```

Then re-run the schema.

---

## 🔄 Automatic Syncing

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync/asana",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes automatically on Vercel.

### Option 2: Manual Trigger

Call the API endpoint whenever you want to sync:

```bash
curl -X POST https://your-dashboard.vercel.app/api/sync/asana \
  -H "Content-Type: application/json" \
  -d '{"fullSync": false}'
```

### Option 3: Local Cron Job

Create `scripts/sync-asana-cron.ts`:

```typescript
import cron from 'node-cron';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Starting Asana sync...');
  const response = await fetch('http://localhost:3000/api/sync/asana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullSync: false })
  });
  const result = await response.json();
  console.log('Sync complete:', result);
});
```

---

## 🎨 Dashboard Components (Next Step)

After verifying data syncs correctly, I'll build:

### 1. Sales Pipeline Dashboard
- Visual kanban board of deals by stage
- Weighted pipeline value
- Close rate by rep
- Win/loss analysis

### 2. Rep Performance Dashboard
- Individual rep metrics
- Leaderboard
- Activity tracking
- Follow-up alerts

### 3. Customer Service Dashboard
- Open issues by priority
- Resolution time metrics
- Rep response times
- Issue categories

### 4. Operations Dashboard
- Task completion rates
- Project progress
- Team capacity
- Overdue alerts

---

## 🐛 Troubleshooting

### "Failed to connect to Asana"
- Check token is correct in `.env.local`
- Token format: `2/[numbers]/[numbers]:[hex]`
- Verify token hasn't expired

### "No data synced"
- Run test script first to verify connection
- Check Supabase tables were created
- Look at `asana_sync_log` table for errors

### "Custom fields not parsing"
- Check field names in Asana match expected names
- Add custom mappings in schema trigger function
- Custom fields stored in `custom_fields` JSONB column

### Sync is slow
- First sync takes longest (fetches everything)
- Subsequent syncs are incremental (faster)
- Limit to specific projects with `projectGids` parameter

---

## 📝 Identifying Your Projects

After running the test script, you'll see output like:

```
📋 Sales Pipeline (1234567890)
📋 Customer Service (0987654321)
📋 Freight Calculator (1122334455)
```

Copy those GIDs and tell me which projects to track:

**Example:**
- **Sales/Quotes**: Project GID `1234567890`
- **Customer Service**: Project GID `0987654321`
- **Freight Issues**: Project GID `1122334455`

I'll configure the sync to focus on those specific projects.

---

## 🎯 What's Next?

Once you complete Step 3 (first sync), tell me:

1. ✅ Did the sync complete successfully?
2. 📊 How many tasks were synced?
3. 📋 Which projects should we prioritize for dashboards?
4. 🔧 Which custom fields are most important to you?
5. 📈 What metrics do you want to see first?

Then I'll build the dashboard UI to visualize all this data!

---

## 🔐 Security Notes

- ✅ Token stored in `.env.local` (not committed to git)
- ✅ Uses service role key for database writes
- ✅ API endpoint can be secured with auth middleware
- ✅ All Asana API calls are read-only

---

Ready to test? Run the connection test script and let me know what you see! 🚀
