# Quick Start - Source 4 Industries

## 3-Step Setup

### 1️⃣ Build Static Dashboard
```bash
cd "Source 4 Industries/Source 4 Dashboard/web"
npm run build
```
✅ Creates static files in `./out/`

### 2️⃣ Deploy to GitHub Pages
```bash
# Copy out/* to your GitHub Pages repo at /s4/
# Commit and push

# Visit: https://fullstackaiautomation.github.io/s4/
```
✅ Dashboard is live!

### 3️⃣ Upload CSV Data (Local)
```bash
cd "Source 4 Industries"
npm install @supabase/supabase-js csv-parse dotenv

# Create .env with your Supabase credentials
# SUPABASE_URL=...
# SUPABASE_KEY=...

node import_ad_spend.js
```
✅ Data synced to Supabase!

---

## That's It!

Your dashboard at `https://fullstackaiautomation.github.io/s4/` will now show live data from Supabase.

---

## Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Upload CSV (from Source 4 Industries folder)
node import_ad_spend.js

# Test upload with first 100 rows
node import_ad_spend.js --test

# Custom batch size
node import_ad_spend.js --batch-size 500
```

---

## Full Guide
See `GITHUB_PAGES_SETUP.md` for detailed instructions.
