# Next Month Quick Reference

## When You're Ready for the Next Month...

### Tell Claude Code This:

```
I'm ready to process [MONTH] ad spend data. Here's what I have:

Month: 2025-11 (November 2025)
Google export: [download from Google Ads → Ads & Assets → Products]
Bing export: [download from Bing Ads → Products]

Please update config.json and run the monthly processing.
```

### Or Simply Say:

```
Process November 2025 ad spend.
```

---

## What Claude Will Do:

1. ✓ Update `config.json` with new month and filenames
2. ✓ Create a new folder labeled with the month (e.g., `2025-11`)
3. ✓ Run `master_workflow.py` to process everything
4. ✓ Generate all reports in the month-labeled folder (CSV, Excel, PDF)
5. ✓ Report any data quality issues
6. ✓ Provide summary of results

---

## Files to Provide:

1. **Google Ads CSV** (monthly download from Google Ads)
   - Typical name: "Product report (1).csv" or "Product report (2).csv"
   - Contains: ~400-500 products with spend data

2. **Bing Ads CSV** (monthly download from Bing Ads)
   - Typical name: numeric (e.g., "7765305030076.csv")
   - Contains: ~350-450 products with spend data

---

## Monthly Timeline:

| Task | Timing |
|------|--------|
| Download reports from platforms | By 5th of month |
| Provide to Claude | By 5th of month |
| Processing completes | Within 5 minutes |
| Review reports | Day 5-10 of month |
| Archive files (optional) | After review |

---

## Expected Outputs:

### CSV Files:
- `2025-11 Product Spend Upload.csv` (main data)
- `2025-11 Missing Categories.csv` (data issues)
- `2025-11 Missing SKUs.csv` (data issues)

### Excel Report:
- `2025-11 Product Spend Report.xlsx`
  - Sheet 1: Full product data (835+ rows)
  - Sheet 2: Missing categories audit
  - Sheet 3: Vendor breakdown with revenue
  - Sheet 4: Executive summary with top 20 analysis

### PDF Report:
- `2025-11 Ad Spend Performance Report.pdf` (6 pages)
  - Page 1: Executive summary
  - Pages 2-6: Top 20 analysis with charts

---

## Data Quality Checklist:

After processing, Claude will check:

- [ ] All products have SKU assignments
- [ ] All products have category assignments
- [ ] Revenue and ROAS metrics calculated
- [ ] All 18 main vendors properly grouped
- [ ] Caster vendors consolidated
- [ ] Ad spend totals match expected range

---

## Example Conversation:

**You:** "I have November 2025 Google and Bing exports ready. How do I proceed?"

**Claude:** "Perfect! Please provide:
1. Your Google Ads CSV export filename
2. Your Bing Ads CSV export filename
3. Confirm month is 2025-11

Then I'll update config.json and run the full processing."

**You:** "Files are in the Monthly Product Ad Spends folder:
- Product report (1).csv (Google)
- 7765305030076.csv (Bing)
- Month: 2025-11"

**Claude:** "Got it! Running master workflow for 2025-11...

[Processing output...]

Complete! Generated files:
- 2025-11 Product Spend Upload.csv (847 products)
- 2025-11 Product Spend Report.xlsx (4 sheets)
- 2025-11 Ad Spend Performance Report.pdf (6 pages)

Data Quality: All SKUs found, all categories assigned ✓"

---

## Updating Master SKU

If you need to add/update products in Master SKU before processing:

1. **Before Processing:**
   - Update Master SKU file
   - Add new SKUs and categories
   - Save and close file

2. **During Processing:**
   - Claude loads the current Master SKU
   - New products automatically picked up
   - No need to re-download exports

3. **After Processing:**
   - Review Missing Categories CSV
   - If items are missing, update Master SKU
   - Rerun for next month with updated database

---

## File Locations:

```
c:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Ads Report\
├── Monthly Product Ad Spends\
│   ├── config.json                     ← Update this each month
│   ├── master_workflow.py              ← Run this
│   ├── process_upload.py
│   ├── create_excel_report.py
│   ├── create_summary_report.py
│   ├── create_pdf_report.py
│   ├── [Google export].csv             ← Download and save here
│   ├── [Bing export].csv               ← Download and save here
│   ├── [Generated files]               ← Output files appear here
│   └── MONTHLY_WORKFLOW.md             ← Detailed instructions
│
└── SKU Documents\
    ├── Google Ads - Product Spend - ID to SKU (1).csv
    └── Google Ads - Product Spend - MASTER SKU (1).csv
```

---

## Summary

**Next month, just tell Claude:**

> "Process [MONTH] ad spend with these files: [Google export name] and [Bing export name]"

**Claude will:**
1. Update configuration
2. Run all processing scripts
3. Generate all reports
4. Report any issues
5. Provide summary

**That's it! Everything else is automated.**
