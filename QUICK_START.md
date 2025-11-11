# Quick Start: Upload Ad Spend Data to Supabase

## TL;DR - 3 Quick Options

### ⚡ Fastest Option (5 min) - Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/tcryasuisocelektmrmb
2. Click "SQL Editor" → "New Query"
3. Paste the contents of `supabase_schema.sql` (if not already run)
4. Click "Run"
5. Go to "Table Editor" and click the upload button
6. Select `sku_ad_spend_upload.csv`
7. Click "Import"

**Done!** 74,929 records uploaded.

---

### 🚀 Automated Option #1 - Node.js (3 min)

```bash
npm install @supabase/supabase-js csv-parse dotenv
node import_ad_spend.js
```

**Status:** Displays real-time progress. Takes ~3-5 minutes.

---

### 🐍 Automated Option #2 - Python (3 min)

```bash
pip install supabase pandas openpyxl python-dotenv
python import_ad_spend_to_supabase.py
```

**Status:** Displays real-time progress. Takes ~3-5 minutes.

---

## Verify Success

Run this query in Supabase SQL Editor:
```sql
SELECT COUNT(*) as total_records FROM sku_ad_spend;
```

**Expected result:** 74,929

---

## What You Get

✓ 74,929 ad spend records (Nov 2022 - Oct 2025)
✓ Google & Bing platform data
✓ Automatic indexes for fast queries
✓ Automatic timestamp triggers
✓ 4 pre-built analysis views
✓ Ready for dashboard visualization

---

## Files Included

| File | Purpose |
|------|---------|
| `sku_ad_spend_upload.csv` | Ready-to-upload data (15 MB) |
| `import_ad_spend.js` | Node.js automated uploader |
| `import_ad_spend_to_supabase.py` | Python automated uploader |
| `supabase_schema.sql` | Database schema (run first) |
| `SUPABASE_DATA_UPLOAD_GUIDE.md` | Detailed guide with all options |

---

## Pre-built Views (After Upload)

Query these instantly for dashboards:

```sql
-- Monthly summary by platform
SELECT * FROM monthly_platform_summary;

-- Vendor performance
SELECT * FROM vendor_performance_summary;

-- Category analysis
SELECT * FROM category_performance_summary;

-- Platform comparison
SELECT * FROM platform_comparison_by_month;
```

---

## Need Help?

- **Dashboard import**: Read "Supabase Dashboard Upload" in SUPABASE_DATA_UPLOAD_GUIDE.md
- **Node.js issues**: Check import_ad_spend.js prerequisites
- **Python issues**: Check import_ad_spend_to_supabase.py prerequisites
- **Data quality**: See "Data Quality Notes" in SUPABASE_DATA_UPLOAD_GUIDE.md

---

## That's It! 🎉

Your ad spend data is ready to power your dashboard.
