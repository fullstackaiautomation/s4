# Source 4 Industries - Deployment Guide

## 🎯 Quick Start - Deploy to s4.fullstackaiautomation.com

Your Next.js backend is now ready to be deployed to your custom domain!

## What's New

✅ **API Routes Created:**
- `/api/import` - CSV upload endpoint with Supabase integration
- `/api/verify` - Database verification endpoint

✅ **Frontend Components:**
- `/import` page - Beautiful CSV upload interface
- `ImportCSV` component - Reusable upload component

✅ **Full Stack Solution:**
- Next.js handles API requests (has network access)
- CSV data parsed and validated on backend
- Data inserted directly to Supabase from your server
- Frontend provides user-friendly upload interface

## Live Test (Local)

Currently running on port 3003:
```bash
http://localhost:3003/import
```

To test locally:
```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Source 4 Dashboard\web"
npm run dev
```

## Deployment Steps

### 1. **Build for Production**
```bash
cd web
npm run build
```

This should complete successfully with all routes shown:
- ✓ `/api/import` (Dynamic)
- ✓ `/api/verify` (Dynamic)
- ✓ `/import` (Static)

### 2. **Deploy to s4.fullstackaiautomation.com**

Based on your setup with other projects, you likely use Vercel or similar. Follow the same process you used for:
- `fullstackaiautomation.com`
- Other deployed projects

**Environment Variables to Set:**
```
SUPABASE_URL=https://tcryasuisocelektmrmb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnlhc3Vpc29jZWxla3Rtcm1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE1ODQ2MCwiZXhwIjoyMDc2NzM0NDYwfQ.HgHPvdDTWuiX1egM7OSsrHmYLfqT6Ijdr1-SPNe8oG0
```

### 3. **Verify Deployment**

Once deployed to s4.fullstackaiautomation.com:

```bash
# Check if API is working
curl https://s4.fullstackaiautomation.com/api/verify

# Should return:
# {"status":"ok","database":"sku_ad_spend","statistics":{"total_records":74929,...}}
```

## How It Works

```
Browser (user uploads CSV)
    ↓
  /import page (React component)
    ↓
  /api/import endpoint (POST)
    ↓
  Parse CSV on Next.js server
    ↓
  Insert to Supabase (via network)
    ↓
  Success response to user
```

## Key Features

✅ **CSV Upload**: Drag-and-drop CSV file upload
✅ **Validation**: Automatic type conversion for numeric fields
✅ **Batch Processing**: Records inserted in batches of 100
✅ **Error Handling**: Detailed error messages if something fails
✅ **Progress Tracking**: Shows inserted vs failed records

## Why This Works (When Scripts Don't)

Your Python/Node.js scripts couldn't run through Claude Code because:
- Claude Code sandbox has no internet access
- Scripts tried to make HTTP requests to Supabase

**Your Next.js backend solves this:**
- Deployed to actual server with internet access
- Handles all API calls server-side
- Frontend just sends file to your server
- Your server has full network access to Supabase

## Next Steps

1. Push to git: `git add . && git commit -m "Add Supabase import backend"`
2. Deploy to vercel/production
3. Test at https://s4.fullstackaiautomation.com/import
4. Upload your CSV file
5. Watch data flow to Supabase!

## Support

If you encounter any issues:
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify Supabase `sku_ad_spend` table exists
- Check browser console for error messages
- Check server logs for detailed errors

---

## Architecture Overview

```
Old Approach (Blocked):
    Claude Code → Python Script → Supabase API ❌ (Sandbox blocks network)

New Approach (Working):
    Browser → Next.js API Route → Supabase API ✅ (Server has network access)
```

This is the same pattern your other projects use - backend services always have better network capabilities than CLI environments!
