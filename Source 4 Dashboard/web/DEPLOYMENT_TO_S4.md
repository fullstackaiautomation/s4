# Deploying to s4.fullstackaiautomation.com

## Quick Deployment Steps

### 1. **Push Code to GitHub**

First, commit and push your changes to the sync repository:

```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries"
git add .
git commit -m "Add Supabase CSV import API and dashboard"
git push origin main
```

### 2. **Deploy via Vercel**

You have two options:

#### **Option A: Deploy from Vercel Dashboard** (Recommended)

1. Go to https://vercel.com
2. Select your "Source 4 Industries" or "Source 4 Dashboard" project
3. Go to **Settings** → **Domains**
4. Add custom domain: `s4.fullstackaiautomation.com`
5. Update your DNS records (if not already pointing to Vercel)

#### **Option B: Deploy via Vercel CLI**

```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Source 4 Dashboard\web"

# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod

# Link to custom domain when prompted
```

### 3. **Set Environment Variables in Vercel**

In your Vercel project settings, add these environment variables:

```
SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnlhc3Vpc29jZWxla3Rtcm1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE1ODQ2MCwiZXhwIjoyMDc2NzM0NDYwfQ.HgHPvdDTWuiX1egM7OSsrHmYLfqT6Ijdr1-SPNe8oG0
```

### 4. **Verify Deployment**

Once deployed, test your endpoints:

```bash
# Test verification endpoint
curl https://s4.fullstackaiautomation.com/api/verify

# Should return:
# {"status":"ok","database":"sku_ad_spend","statistics":{...}}
```

### 5. **Use the Import Dashboard**

Visit: https://s4.fullstackaiautomation.com/import

You should see:
- Data Import Dashboard with upload form
- File upload interface
- Database information showing 74,929 records

---

## DNS Configuration

If you haven't already, point your DNS to Vercel:

For `s4.fullstackaiautomation.com`:
- **CNAME**: `cname.vercel.app`

Or set up via your domain registrar:
1. Go to your domain provider (GoDaddy, Namecheap, etc.)
2. Add CNAME record: `s4` → `cname.vercel.app`
3. Wait 15-60 minutes for DNS propagation

---

## Troubleshooting

### "API endpoint returns 500 error"
- Check environment variables are set in Vercel
- Check Supabase credentials are correct
- Check Supabase `sku_ad_spend` table exists

### "CSV upload fails"
- Verify file is valid CSV format
- Check file size (should be < 20MB)
- Check browser console for specific error

### "Domain not resolving"
- Wait for DNS propagation (up to 48 hours)
- Verify CNAME record is set correctly
- Purge browser cache and try again

---

## What's Running

Once deployed, your `s4.fullstackaiautomation.com` will have:

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Dashboard home |
| `/import` | GET | CSV upload page |
| `/api/import` | POST | Upload & import CSV to Supabase |
| `/api/verify` | GET | Check database connection & stats |

---

## Architecture

```
User Browser
   ↓
s4.fullstackaiautomation.com (Vercel)
   ├─ /import page (Next.js)
   ├─ /api/import (Next.js API)
   ├─ /api/verify (Next.js API)
   ↓
Supabase (tcryasuisocelektmrmb.supabase.co)
   ↓
sku_ad_spend table (74,929 records)
```

---

## Next Time

To redeploy after making changes:

```bash
# Make changes to code
# Commit and push
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys on push!
# Or manually deploy
vercel --prod
```

Done! Your Next.js backend can now handle CSV uploads with full network access to Supabase.
