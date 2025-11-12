# 🚀 Deploy to GitHub Pages NOW

Your files are built and ready at:
```
Source 4 Industries/Source 4 Dashboard/web/out/
```

## 2-Minute Deploy

### Step 1: Go to GitHub and Enable Pages

1. Go to your repository settings/pages
2. Under "Build and deployment":
   - Source: Select "Deploy from a branch"
   - Branch: Select "main" and "/root"
3. Click **Save**

### Step 2: Create s4 Folder in Root of Repo

```bash
# Copy the built files into an "s4" folder in the repo root
cp -r "Source 4 Industries/Source 4 Dashboard/web/out"/* ./s4/

# Or if that fails, manually:
# 1. Create folder "s4/" in the repo root
# 2. Copy all files from "Source 4 Industries/Source 4 Dashboard/web/out/" into it
```

### Step 3: Commit and Push

```bash
git add s4/
git commit -m "Deploy Source 4 Dashboard to GitHub Pages"
git push origin main
```

### Step 4: Wait & Visit

GitHub will build automatically. Give it 1-2 minutes, then visit:
```
https://fullstackaiautomation.github.io/s4/
```

---

## Alternative: Upload via GitHub Web UI

1. Go to your repository
2. Click "Upload files"
3. Create folder: `s4`
4. Upload all files from `Source 4 Industries/Source 4 Dashboard/web/out/` to that folder
5. Commit

Then visit: https://fullstackaiautomation.github.io/s4/

---

## After Deploy

Once live, your dashboard connects to **live Supabase data**. To upload CSV data:

```bash
cd "Source 4 Industries"
node import_ad_spend.js
```

Data will appear in dashboard automatically!
