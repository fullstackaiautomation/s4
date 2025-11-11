# Source 4 Industries - GitHub Pages Deployment

## Architecture

```
Your Local Computer
├─ import_ad_spend.js (Node.js script)
└─ sku_ad_spend_upload.csv (your CSV file)
       ↓
       ↓ Run locally
       ↓
   Supabase (Live Database)
       ↑
       ↑ Connected to
       ↑
GitHub Pages (Static Dashboard)
https://fullstackaiautomation.github.io/s4/
```

## Step 1: Build the Static Dashboard

```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Source 4 Dashboard\web"

# Build for static export
npm run build

# Output goes to: ./out/
```

## Step 2: Deploy to GitHub Pages

The built files need to be in your GitHub Pages repository. Based on the screenshot, your pages URL is:
```
https://fullstackaiautomation.github.io/s4/
```

### Copy built files to GitHub Pages repo:

```bash
# After building, the static files are in ./out/

# Copy them to your GitHub Pages repo (adjust path as needed)
cp -r out/* /path/to/fullstackaiautomation.github.io/s4/

# Or if they should be in the root:
cp -r out/* /path/to/fullstackaiautomation.github.io/
```

### Push to GitHub:

```bash
cd /path/to/fullstackaiautomation.github.io
git add .
git commit -m "Update Source 4 Dashboard"
git push origin main
```

## Step 3: Upload Data Using Local Script

When you have new CSV data to upload:

```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries"

# Install dependencies (one time only)
npm install @supabase/supabase-js csv-parse dotenv

# Create .env file with your Supabase credentials
# Add to .env:
# SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
# SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Upload your CSV file
node import_ad_spend.js

# Or test with just first 100 rows
node import_ad_spend.js --test

# Or use custom batch size
node import_ad_spend.js --batch-size 500
```

## Step 4: View Your Dashboard

Once deployed, visit:
```
https://fullstackaiautomation.github.io/s4/
```

The dashboard will connect to live data in Supabase!

---

## File Structure

```
Source 4 Industries/
├── Source 4 Dashboard/
│   └── web/                        ← Next.js project (builds to static)
│       ├── src/
│       │   ├── app/               ← Pages (no API routes)
│       │   ├── components/        ← React components
│       │   └── lib/               ← Utilities & Supabase client
│       ├── next.config.ts         ← Configured for static export
│       ├── out/                   ← Built static files (after npm run build)
│       └── package.json
│
├── import_ad_spend.js             ← Local Node.js script (runs on your computer)
├── sku_ad_spend_upload.csv        ← Your CSV data
├── .env                           ← Supabase credentials (local only)
└── GITHUB_PAGES_SETUP.md          ← This file
```

---

## Key Differences from Before

| Before | Now |
|--------|-----|
| Claude Code → Python script ❌ | Node.js script on your computer ✅ |
| Tried to reach Supabase API from sandbox ❌ | Your computer has full network access ✅ |
| Next.js with API routes | Static Next.js (GitHub Pages compatible) |
| Needed Vercel deployment | GitHub Pages (free, already set up) |

---

## Workflow Summary

### Development:
```bash
cd Source 4 Industries/Source 4 Dashboard/web
npm run dev          # Local development at http://localhost:3000
```

### Production (Dashboard):
```bash
npm run build        # Creates ./out/ with static files
# Copy ./out/* to GitHub Pages repo
# Push to GitHub
```

### Data Upload (Local):
```bash
cd ..                # Back to Source 4 Industries folder
node import_ad_spend.js  # Upload CSV to Supabase
```

---

## Environment Variables

Create a `.env` file in `Source 4 Industries/` with:

```
SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnlhc3Vpc29jZWxla3Rtcm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTg0NjAsImV4cCI6MjA3NjczNDQ2MH0.ph2fiRKBIrgqwAnDOG_wM6-RehO0M_EJ1QJInItH8aQ
```

**Note:** Keep your `.env` file local - don't commit it to Git!

---

## Testing

### Test Dashboard Locally:
```bash
cd Source 4 Industries/Source 4 Dashboard/web
npm run dev
# Visit http://localhost:3000 (or http://localhost:3000/s4 depending on basePath)
```

### Test CSV Upload:
```bash
cd Source 4 Industries
node import_ad_spend.js --test
# This uploads only first 100 rows
```

### Test GitHub Pages:
```bash
# After deploying, visit:
https://fullstackaiautomation.github.io/s4/

# You should see your Source 4 Dashboard
# Connected to live Supabase data
```

---

## Troubleshooting

### "Module not found" when running import script
```bash
npm install @supabase/supabase-js csv-parse dotenv
```

### "SUPABASE_URL is undefined"
- Create `.env` file in the Source 4 Industries folder (not in web/)
- Add your Supabase credentials

### GitHub Pages shows 404
- Check that files are pushed to the correct branch (main)
- Verify the `basePath: "/s4"` in next.config.ts
- Check GitHub Pages settings to deploy from `main` branch

### CSV upload fails
- Verify CSV format matches expected schema
- Check file size (should be < 100MB)
- Make sure Supabase `sku_ad_spend` table exists
- Try test mode: `node import_ad_spend.js --test`

---

## Next Steps

1. ✅ Build dashboard: `npm run build`
2. ✅ Copy to GitHub Pages repo
3. ✅ Push to GitHub
4. ✅ Visit dashboard at https://fullstackaiautomation.github.io/s4/
5. ✅ Upload CSV locally: `node import_ad_spend.js`
6. ✅ Watch data appear in dashboard!

**That's it!** 🎉
