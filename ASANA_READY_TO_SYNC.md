# 🎉 Asana Integration - READY TO SYNC!

## ✅ Connection Test Results

**Status:** SUCCESSFUL ✓

### Your Asana Account:
- **User:** Taylor Grassmick
- **Email:** taylorg@source4industries.com
- **Workspace:** source4industries.com
- **Total Projects:** 76 projects
- **Total Custom Fields:** 48 custom fields

### Sample Projects Found:
1. Google Workspace Migration (23 tasks)
2. Pallet Rack Projects
3. Abandoned Carts
4. Social Media Ads
5. Phone System
6. Instagram Posts
7. Misc. Items
8. Physical Marketing Products
9. Dock & Doors Website
10. Price Adjustments
... and 66 more!

### Custom Fields Detected:
Your Asana workspace has 48 custom fields including:
- **Risk Assessment Status** (enum)
- **Data Sensitivity** (enum)
- **Vendor Type** (enum)
- **Point of Contact** (text)
- **Contract Status** (enum)
- **Order Value** (number)
- **Percent Change** (number)
- **Priority** (enum)
- **Status** (enum)
... and 40 more

---

## 🚀 Next Steps (10 minutes to live data!)

### Step 1: Run Database Schema (3 min)

1. Go to Supabase: https://tcryasuisocelektmrmb.supabase.co
2. Click **SQL Editor** → **New Query**
3. Copy ALL contents of: `Document Storage/SQL/asana_schema.sql`
4. Paste into SQL Editor
5. Click **Run**

**Expected:** ✅ "Success. No rows returned"

### Step 2: Update Sync Service (1 min)

The sync service needs to use the simple client. I'll update that now...

### Step 3: Run First Sync (5 min)

```bash
cd "Source 4 Dashboard/web"
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/sync/asana -H "Content-Type: application/json" -d '{"fullSync":true}'
```

Or PowerShell:
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/sync/asana" -Body '{"fullSync":true}' -ContentType "application/json"
```

This will:
- ✅ Sync all 76 projects
- ✅ Sync all tasks from all projects
- ✅ Parse all 48 custom fields
- ✅ Create materialized views for sales/operations

**Expected time:** 2-5 minutes (depends on number of tasks)

### Step 4: Verify in Supabase (1 min)

Go to **Table Editor** and check:
- `asana_workspaces` (1 row)
- `asana_projects` (76 rows)
- `asana_tasks` (hundreds/thousands of rows)
- `asana_custom_field_definitions` (48 rows)
- `asana_sales_pipeline` (view - filtered tasks with quote amounts)

---

## 📊 Which Projects Should We Track?

Looking at your project list, which ones contain:

### Sales / Quotes?
(e.g., "Sales Pipeline", "Quotes", "Opportunities")

### Customer Service Issues?
(e.g., "Customer Service", "Support Tickets")

### Freight Calculator Issues?
(e.g., "Freight Calculator", "Shipping Issues")

### Sales Follow-ups?
(e.g., "Sales Follow-up", "Lead Nurture")

**Tell me which projects by name or GID, and I'll:**
1. Focus dashboards on those projects
2. Create custom filters for those project types
3. Build alerts for important tasks in those projects

---

## 🎨 Dashboard Features Coming Next

Once sync is complete, I'll build:

### 1. Sales Pipeline Dashboard
- Visual kanban board by deal stage
- Weighted pipeline calculator
- Close rate by rep
- Deal velocity tracking
- Win/loss analysis

### 2. Rep Performance Dashboard
- Leaderboard (revenue, close rate, activity)
- Open pipeline by rep
- Overdue follow-ups
- Response time metrics
- Activity heatmap

### 3. Customer Service Dashboard
- Open tickets by priority
- Average resolution time
- Response time by rep
- Issue categories breakdown
- SLA compliance tracking

### 4. Operations Dashboard
- Project progress tracking
- Task completion rates
- Team capacity view
- Overdue tasks alerts
- Blocked tasks report

---

## 🔧 Custom Field Mapping

Based on your custom fields, I'll automatically map:

### For Sales/Quotes:
- **Order Value** → `quote_amount`
- **Status** → `task_status`
- **Priority** → `priority`

### For Contracts:
- **Contract Status** → parsed
- **Vendor Type** → parsed
- **Point of Contact** → parsed

### For Risk Assessment:
- **Risk Assessment Status** → parsed
- **Data Sensitivity** → parsed

All custom fields are also stored in the `custom_fields` JSONB column for flexible querying.

---

## 📈 What You'll Be Able to Do

After sync + dashboards:

### Real-time Visibility:
- See all quotes/opportunities in one place
- Track deal progression through stages
- Monitor rep performance metrics
- Identify bottlenecks in sales process

### Smart Alerts:
- Overdue follow-ups
- High-value deals at risk
- Stalled opportunities
- Response time violations

### Performance Analytics:
- Close rate by rep, by month, by deal size
- Average time to close by stage
- Win/loss analysis by reason
- Pipeline coverage (open pipeline / quota)

### Custom Reporting:
- Filter by any custom field
- Group by project, rep, status, priority
- Export to CSV for external analysis
- Schedule automated reports

---

## 🔄 Sync Schedule Recommendations

### Option 1: Real-time (Every 15 min) - Recommended
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync/asana",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option 2: Hourly
```
"schedule": "0 * * * *"
```

### Option 3: Every 4 hours
```
"schedule": "0 */4 * * *"
```

For your use case (sales pipeline tracking), I recommend **every 15 minutes** so reps see updates quickly.

---

## 💡 Pro Tips

### Optimize Sync Performance:
1. **First sync:** Use `fullSync: true` (syncs everything)
2. **Subsequent syncs:** Use `fullSync: false` (only new/modified)
3. **Specific projects:** Pass `projectGids: ["123", "456"]` to sync only those

### Custom Field Tips:
- Use consistent naming (e.g., always "Quote Amount" not "Deal Value" sometimes)
- Use enum fields for statuses (better for reporting)
- Number fields for dollar amounts (enables calculations)
- Date fields for due dates (enables aging reports)

### Dashboard Tips:
- Pin your most important metrics
- Set up Slack/email alerts for critical items
- Create saved filters for common views
- Use materialized views for fast queries

---

## 🆘 Need Help?

### If sync fails:
1. Check `asana_sync_log` table for errors
2. Verify database schema ran successfully
3. Check API token hasn't expired
4. Look for rate limit errors (429 status)

### If data looks wrong:
1. Verify custom field names match expected
2. Check `custom_fields` JSONB column for raw data
3. Refresh materialized views manually
4. Check date filters (we filter out pre-2022-11-01 sales data)

### If performance is slow:
1. Add indexes to frequently queried columns
2. Use materialized views instead of live queries
3. Limit results with LIMIT clause
4. Cache results in frontend

---

## ✅ Checklist

- [x] Asana connection tested successfully
- [x] 76 projects discovered
- [x] 48 custom fields identified
- [ ] **Database schema created** ← DO THIS NEXT
- [ ] First sync completed
- [ ] Data verified in Supabase
- [ ] Dashboard components built
- [ ] Automatic sync schedule configured

---

**Ready to proceed?**

1. Run the database schema in Supabase
2. Let me know when done
3. I'll update the sync service to use the simple client
4. You run the first sync
5. I'll build the dashboards!

🚀 You're minutes away from live Asana data in your dashboard!
