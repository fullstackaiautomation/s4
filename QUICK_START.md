# ⚡ QUICK START - Asana Integration

## 🎯 3 Steps to Live Data (10 Minutes)

### Step 1: Create Database Tables (3 min)

1. Open: https://tcryasuisocelektmrmb.supabase.co
2. Click: **SQL Editor** → **New Query**
3. Copy: `Document Storage/SQL/asana_schema.sql` (entire file)
4. Paste and click **Run**
5. Verify: ✅ "Success. No rows returned"

### Step 2: Start Dev Server (1 min)

```bash
cd "Source 4 Dashboard/web"
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 3: Run First Sync (5 min)

**Open new terminal**, then run:

```powershell
# PowerShell
$body = @{ fullSync = $true } | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/asana" `
  -Body $body `
  -ContentType "application/json"
```

**Expected output:**
```json
{
  "success": true,
  "recordsSynced": 450,
  "duration": 12500,
  "message": "Successfully synced 450 records in 12.5s"
}
```

### Step 4: Verify Data (1 min)

Go to Supabase → **Table Editor**:
- Click `asana_tasks` → Should see your tasks!
- Click `asana_projects` → Should see 76 projects!
- Click `asana_sales_pipeline` → Filtered sales view!

---

## ✅ Done!

Your Asana data is now in Supabase and ready for dashboards!

### What You Just Built:
- ✅ Live sync from Asana to Supabase
- ✅ 76 projects tracked
- ✅ All tasks with custom fields
- ✅ Sales pipeline aggregation
- ✅ Rep performance metrics

### Next Steps:
1. Tell me which projects are most important
2. I'll build custom dashboards for those projects
3. Set up automatic sync (every 15 min)
4. Add alerts for critical items

---

## 🔄 Running Syncs

### Manual Sync (Anytime):
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/sync/asana" `
  -Body '{"fullSync":false}' `
  -ContentType "application/json"
```

### Automatic Sync (Recommended):
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync/asana",
    "schedule": "*/15 * * * *"
  }]
}
```

Syncs every 15 minutes automatically!

---

## 📚 Full Documentation

- **Setup Guide**: `ASANA_INTEGRATION_SETUP.md`
- **Complete Details**: `ASANA_INTEGRATION_COMPLETE.md`
- **Ready to Sync**: `ASANA_READY_TO_SYNC.md`
- **Live Data Plan**: `Document Storage/Documentation/LIVE_DATA_INTEGRATION_PLAN.md`

---

## 🆘 Issues?

### Sync fails:
```powershell
# Check sync log
# Go to Supabase → Table Editor → asana_sync_log
```

### No data:
- Verify database schema ran (check tables exist)
- Check `.env.local` has ASANA_ACCESS_TOKEN
- Restart dev server

### Questions:
- Check documentation files above
- Look at `asana_sync_log` table for errors

---

Ready? Run Step 1! 🚀
