# Monthly Ad Spend Processing Workflow

This guide explains how to process your monthly Google Ads and Bing Ads data using the automated ad spend processor.

## Quick Start (TL;DR)

1. Download Google and Bing CSV exports
2. Edit `config.json`:
   ```json
   {
     "month": "2025-11",
     "input_files": {
       "google": "Product report (1).csv",
       "bing": "7765305030076.csv"
     }
   }
   ```
3. Run: `python master_workflow.py`
4. Check the generated reports!

---

## Step-by-Step Instructions

### Step 1: Download Monthly Data Exports

#### Google Ads Export:
1. Go to Google Ads account → Ads & Assets → Products
2. Download report as CSV (typically named "Product report (1).csv")
3. Save in the `Monthly Product Ad Spends` parent directory
4. File should have ~400-500 products depending on your account

#### Bing Ads Export:
1. Go to Bing Ads account → Products
2. Download report as CSV
3. File usually has a numeric name (e.g., "7765305030076.csv")
4. Save in the `Monthly Product Ad Spends` parent directory
5. File should have ~350-450 products depending on your account

### Step 2: Update Configuration File

Open `config.json` in the `Ad Spend Processor Skill Files` folder:

```json
{
  "month": "2025-11",
  "input_files": {
    "google": "Product report (1).csv",
    "bing": "7765305030076.csv"
  },
  "paths": {
    "sku_documents": "..\\..\\..\\SKU Documents",
    "input_dir": "..",
    "output_dir": "../{month}"
  },
  "notes": "Update 'month' and 'input_files' when processing a new month. Output goes to ../2025-11, ../2025-12, etc."
}
```

**What to change:**
- **"month"**: Change to the current month in `YYYY-MM` format (e.g., "2025-11" for November 2025)
- **"google"**: Update filename to match your Google export (usually "Product report (X).csv")
- **"bing"**: Update filename to match your Bing export (usually a numeric filename)

**DO NOT change:**
- The paths (they point to lookup files)
- The "input_dir" and "output_dir" (use current directory)

### Step 3: Run the Master Workflow

Open Command Prompt/PowerShell in the `Monthly Product Ad Spends` directory:

```bash
python master_workflow.py
```

This will:
1. Load configuration
2. Verify input files exist
3. Process raw Google and Bing data
4. Create Excel report with vendor breakdown
5. Add summary analysis sheet to Excel
6. Generate PDF report with charts

Expected time: **2-5 minutes** depending on product count

### Step 4: Review Generated Files

After running the workflow, all files are organized in a **month-labeled folder** (e.g., `2025-11`):

#### CSV Files (in `2025-11` folder):
- **`YYYY-MM Product Spend Upload.csv`** - Main upload sheet with all standardized data (835+ products)
- **`YYYY-MM Missing Product Categories.csv`** - Products without category assignments
- **`YYYY-MM Missing SKUs.csv`** - Products without SKU lookups

#### Excel Report (in `2025-11` folder):
- **`YYYY-MM Product Spend Report.xlsx`** with 4 sheets:
  - **Sheet 1: Product Spend Upload** - All 835+ products with full details
  - **Sheet 2: Missing Categories** - Products needing category research
  - **Sheet 3: Vendor Breakdown** - Category-level spend and revenue by vendor
  - **Sheet 4: Summary Report** - Top 20 analysis by spend, revenue, CPC, vendors, categories

#### PDF Report (in `2025-11` folder):
- **`YYYY-MM Ad Spend Performance Report.pdf`** (6 pages):
  - **Pages 1-6:** Top 20 analysis sections with charts and tables
    - Top 20 Products by Ad Spend
    - Top 20 Products by Revenue
    - Top 20 Highest CPC by SKU
    - Top 20 Vendors by Ad Spend
    - Top 20 Categories with Vendor Details

### Step 5: Data Quality Review

Check the "Missing" files for any issues:

#### Missing SKUs:
- These products couldn't be matched to your Master SKU database
- Action: Research products and add SKUs to Master SKU if needed
- Then update the Master SKU file and rerun

#### Missing Categories:
- Products were found but don't have category assignments
- Action: Review the Master SKU to assign categories
- Then rerun the workflow to update reports

---

## What Happens Behind the Scenes

### 1. Data Processing (`process_upload.py`)
- Loads Google and Bing CSV exports
- Extracts SKU from multiple sources with intelligent fallback:
  1. Custom Label 1 (direct SKU)
  2. Item ID to SKU lookup (with base ID parsing for special formats)
  3. Product title matching in Master SKU
- Looks up product categories from Master SKU database
- Removes summary rows from source data
- Exports 3 CSV files (main + missing SKUs + missing categories)

### 2. Excel Generation (`create_excel_report.py` + `create_summary_report.py`)
- Creates workbook with 4 sheets
- Formats data with proper styling and colors
- Calculates vendor totals and revenue by category
- Creates Vendor Breakdown with all 18 main vendors
- Adds Summary Report with top 20 analysis

### 3. PDF Generation (`create_pdf_report.py`)
- Creates professional 6-page PDF report
- Generates charts with matplotlib
- Formats tables with reportlab
- Calculates metrics: ROAS, CPC, revenue totals
- Includes executive summary page

---

## Configuration Details

### Configuration File (`config.json`)

```json
{
  "month": "2025-10",                    // YYYY-MM format
  "input_files": {
    "google": "Product report (1).csv",   // Your Google export filename
    "bing": "7765305030076.csv"           // Your Bing export filename
  },
  "paths": {
    "sku_documents": "..\\SKU Documents", // Location of Master SKU files
    "input_dir": ".",                     // Input directory (current)
    "output_dir": "."                     // Output directory (current)
  },
  "notes": "Update 'month' and 'input_files' when processing a new month."
}
```

**Key Settings:**
- **month**: Used in output filenames (YYYY-MM format)
- **input_files.google**: Filename of your Google Ads export
- **input_files.bing**: Filename of your Bing Ads export
- **paths.sku_documents**: Location of Master SKU and ID-to-SKU lookup files

---

## Troubleshooting

### "File not found" Error
**Problem:** Script can't find Google or Bing CSV
**Solution:**
1. Verify filenames in config.json match actual files
2. Check files are in the `Monthly Product Ad Spends` directory
3. Use exact filename including spaces and parentheses

### "config.json not found" Error
**Problem:** Master workflow can't find configuration file
**Solution:**
1. Ensure config.json exists in the `Monthly Product Ad Spends` directory
2. Check spelling: exactly "config.json" (lowercase)

### Missing products in output
**Problem:** Some Google or Bing products not in final report
**Solution:**
1. Check `YYYY-MM Missing SKUs.csv` - if empty, all products processed
2. If SKUs missing, update Master SKU with new products
3. Rerun workflow to pick up new SKUs

### Wrong month in reports
**Problem:** Reports show wrong month (e.g., "2025-10" instead of "2025-11")
**Solution:**
1. Edit config.json and change "month" field
2. Rerun master_workflow.py
3. Old files will be overwritten with new month

### Files are _NEW version
**Problem:** Seeing files like "2025-10 Product Spend Upload_NEW.csv"
**Solution:**
1. This is normal - process_upload.py creates _NEW versions
2. Other scripts rename these to final names
3. Run full master_workflow.py to create all final files

---

## Monthly Processing Checklist

- [ ] Download Google Ads CSV export
- [ ] Download Bing Ads CSV export
- [ ] Save both files in `Monthly Product Ad Spends` directory
- [ ] Edit config.json:
  - [ ] Update "month" (YYYY-MM format)
  - [ ] Update "google" filename
  - [ ] Update "bing" filename
- [ ] Run: `python master_workflow.py`
- [ ] Wait for completion (2-5 minutes)
- [ ] Check for errors in console output
- [ ] Review CSV output for missing data:
  - [ ] Check Missing SKUs file (should be small or empty)
  - [ ] Check Missing Categories file (should be small or empty)
- [ ] Open Excel report and verify vendor breakdown
- [ ] Open PDF report and check visualizations
- [ ] Archive or move completed files if desired

---

## Advanced: Custom Input Filenames

If Google or Bing give you different filename formats:

1. Download the files and note exact filenames
2. Open config.json
3. Update input_files section:
   ```json
   "input_files": {
     "google": "Product report (2).csv",    // Changed from (1)
     "bing": "7765305030077.csv"            // Different ID number
   }
   ```
4. Save config.json
5. Run: `python master_workflow.py`

---

## Performance Notes

### Processing Speed:
- Small accounts (400 products): ~30-60 seconds
- Medium accounts (800 products): ~1-2 minutes
- Large accounts (1000+ products): ~2-5 minutes

### File Sizes (approximate):
- CSV Upload Sheet: 100-150 KB
- Excel Report: 110-140 KB
- PDF Report: 120-150 KB

### Storage:
- Keep one month of files active
- Archive previous months to reduce clutter
- Delete very old reports (>6 months) if needed

---

## Next Steps

Once monthly processing is complete:

1. **Review Data Quality**
   - Check missing SKUs/categories files
   - Update Master SKU if needed for next month

2. **Analyze Performance**
   - Review PDF report summary metrics
   - Check top 20 products and categories
   - Identify underperforming vendors

3. **Archive Files** (Optional)
   - Create folder like "2025-10-Archive"
   - Move completed files there
   - Keep workspace clean for next month

4. **Prepare Next Month**
   - Bookmark this workflow document
   - Set calendar reminder to run by 5th of month
   - Keep SKU database updated

---

## Support & Questions

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all input files have correct filenames
3. Ensure config.json is valid JSON (no extra commas or missing quotes)
4. Check console output for specific error messages
5. Review the SKILL.md for detailed technical information

---

**Last Updated:** October 2025
**Version:** 1.0
**Compatible With:** 18 main vendors, 113 product categories
