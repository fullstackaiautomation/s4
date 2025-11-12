# Google Ads → Sheets → Claude Automation Setup Guide

This guide will help you set up automated Google Ads reporting using Google Ads Scripts (no API approval needed!) connected to Claude Desktop.

---

## 📋 Overview

**The Workflow:**
1. Google Ads Script runs monthly (automatic)
2. Data exports to Google Sheets (automatic)
3. Claude Desktop reads from Google Sheets via MCP (automatic)
4. You ask Claude for insights, reports, analysis (interactive)

**Benefits:**
- ✅ No API token approval needed
- ✅ Fully automated data collection
- ✅ Works with Claude Desktop as a skill
- ✅ Free (uses built-in Google Ads features)
- ✅ Can schedule to run automatically

---

## 🚀 Step 1: Create Your Google Sheet

1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Name it: "Google Ads Monthly Reports"
4. **Copy the URL** - you'll need this!
5. Example URL: `https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit`

---

## 📊 Step 2: Set Up Google Ads Script

1. **Go to Google Ads:**
   - Open https://ads.google.com
   - Select your account (689-496-3253)

2. **Navigate to Scripts:**
   - Click **Tools & Settings** (wrench icon, top right)
   - Under "Bulk Actions", click **Scripts**

3. **Create New Script:**
   - Click the **+ (plus)** button
   - Name it: "Monthly Performance Export"

4. **Paste the Code:**
   - Open the file: `google-ads-script-to-sheets.js`
   - Copy ALL the code
   - Paste it into the Google Ads Script editor

5. **Configure:**
   - Find line 18: `const SPREADSHEET_URL = 'YOUR_GOOGLE_SHEET_URL_HERE';`
   - Replace with your Google Sheet URL from Step 1
   - Example: `const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit';`

6. **Authorize:**
   - Click **Preview** button
   - Google will ask for permissions - **Authorize** it
   - It needs access to read Google Ads data and write to Sheets

7. **Test Run:**
   - Click **Run** button
   - Check the Logs panel at the bottom
   - Look for "✅ Export complete!"
   - Go to your Google Sheet - you should see data!

8. **Schedule (Optional):**
   - Click **Run frequency** button
   - Set to: **Monthly**, on the **1st** day
   - Choose a time (e.g., 6:00 AM)
   - Click **Save**

---

## 🔌 Step 3: Install Google Sheets MCP Server

1. **Open Terminal/Command Prompt**

2. **Run Installation Command:**
   ```bash
   npx @modelcontextprotocol/create-server gdrive
   ```

3. **Follow Prompts:**
   - It will ask for Google OAuth credentials
   - Use your own Google Cloud credentials (create via Google Cloud Console)
     - Client ID: `YOUR_GOOGLE_CLIENT_ID`
     - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

4. **Or Install via NPM:**
   ```bash
   npm install -g @modelcontextprotocol/server-gdrive
   ```

5. **Add to Claude Desktop Config:**
   - Open: `C:\Users\blkw\AppData\Roaming\Claude\claude_desktop_config.json`
   - Add the Google Drive/Sheets MCP server configuration

---

## 🎯 Step 4: Configure Claude Desktop

1. **Edit MCP Config:**
   Open `claude_desktop_config.json` and add:
   ```json
   {
     "mcpServers": {
       "google-ads": {
         // ... existing config ...
       },
       "google-drive": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-gdrive"],
         "env": {
           "GDRIVE_CLIENT_ID": "YOUR_GOOGLE_CLIENT_ID",
           "GDRIVE_CLIENT_SECRET": "YOUR_GOOGLE_CLIENT_SECRET"
         }
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Authorize Google Drive:**
   - First time you use it, Claude will prompt for authorization
   - Sign in with your Google account
   - Grant permissions

---

## 💬 Step 5: Use Your New Skill!

Now you can ask Claude Desktop things like:

### Monthly Report:
```
"Pull my latest Google Ads data from the 'Google Ads Monthly Reports' sheet and create a summary report"
```

### Campaign Analysis:
```
"Analyze which campaigns had the best ROI last month based on the Google Ads sheet"
```

### Budget Recommendations:
```
"Based on the Google Ads data, recommend how I should allocate budget next month"
```

### Comparisons:
```
"Compare this month's performance to last month using the Google Ads sheet"
```

---

## 📅 Monthly Workflow

Once set up, here's your monthly process:

### Automated (No action needed):
1. On the 1st of each month, Google Ads Script runs automatically
2. Data exports to your Google Sheet
3. Sheet is ready for Claude to analyze

### Manual (2 minutes):
1. Open Claude Desktop
2. Ask: "Analyze last month's Google Ads performance"
3. Claude reads the Sheet via MCP
4. Claude provides insights, charts, recommendations
5. Done!

---

## 🔧 Troubleshooting

### Script won't run:
- Check authorization - re-authorize if needed
- Verify Sheet URL is correct
- Check date range makes sense

### No data in Sheet:
- Run script manually first with "Run" button
- Check Logs panel for errors
- Verify your account has campaigns in the date range

### Claude can't see the data:
- Verify Google Drive MCP is enabled in settings
- Try toggling it off and on
- Start a new conversation in Claude Desktop
- Make sure you're referencing the correct sheet name

### Need to change date range:
- Edit the script
- Modify `DATE_RANGE` section (lines 17-23)
- Can set to last 30 days, specific month, etc.

---

## 🎁 Bonus: Bing Ads

For Bing Ads, you can:
1. Export manually to CSV (Bing doesn't have scripts)
2. Upload CSV to the same Google Sheet (different tab)
3. Ask Claude to analyze both together:
   ```
   "Compare Google Ads vs Bing Ads performance from the sheet"
   ```

---

## 📞 Need Help?

- **Google Ads Scripts Docs:** https://developers.google.com/google-ads/scripts
- **MCP Documentation:** https://modelcontextprotocol.io
- **This setup was created:** October 18, 2025

---

## ✅ Success Checklist

- [ ] Google Sheet created with URL saved
- [ ] Google Ads Script pasted and configured
- [ ] Script authorized and test run successful
- [ ] Data visible in Google Sheet
- [ ] Google Drive MCP installed
- [ ] Claude Desktop config updated
- [ ] Claude Desktop restarted
- [ ] Test query successful
- [ ] Monthly schedule set (optional)

**You're all set! 🎉**
