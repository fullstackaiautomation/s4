# S4 Ad Spend Processor - Finalized Configuration

## Overview
The Claude Ad Spend Processor skill has been finalized for clean, streamlined monthly reporting.

## What Changed
✅ **Finalized exports** - Only 2 files exported per month
✅ **Cleaner organization** - Files in proper `YYYY-MM Ad Spend Reports` folders
✅ **Single Excel workbook** - All data in one file with 5 tabs
✅ **Professional PDF** - Complete analysis report

## Output Structure

### Location
```
Ads Report/Monthly Product Ad Spends/
├── 2025-10 Ad Spend Reports/          ← Monthly folder
│   ├── 2025-10 Product Spend Report.xlsx
│   └── 2025-10 Ad Spend Performance Report.pdf
├── 2025-11 Ad Spend Reports/
│   ├── 2025-11 Product Spend Report.xlsx
│   └── 2025-11 Ad Spend Performance Report.pdf
└── ... (more monthly folders)
```

### Files Generated

#### 1. Product Spend Report.xlsx
Single Excel workbook containing **5 tabs**:
- **Product Spend Upload**: Raw processed data with SKU, platform, metrics
- **Vendor Breakdown**: Vendor-level analysis by ad spend, revenue, ROAS
- **Summary Report**: Top 20 analyses across multiple dimensions
- **Missing Categories**: Products with unassigned categories
- **Missing SKUs**: Products without valid SKU mappings

#### 2. Ad Spend Performance Report.pdf
6-page professional PDF with:
- Executive summary
- Top 20 products by ad spend (Google & Bing)
- Top 20 products by revenue (Google & Bing)
- Top 20 highest CPC analysis
- Top 20 vendors by spend
- Top 20 categories analysis
- Visual comparisons between platforms

## Processing Workflow

### Configuration (config.json)
```json
{
  "month": "2025-10",
  "input_files": {
    "google": "TG Google Ads Product Spend (Final) (3).csv",
    "bing": "TG_Monthly_Bing_Ads_Product_Spend (2).xlsx"
  },
  "paths": {
    "sku_documents": "..\\..\\SKU Documents",
    "input_dir": "..",
    "output_dir": "../{month}"
  }
}
```

### Processing Steps
1. **process_upload.py** - Loads and merges Google/Bing data, applies SKU mapping
2. **create_excel_report.py** - Creates vendor breakdown and uploads sheets
3. **create_summary_report.py** - Generates summary analysis sheet
4. **create_pdf_report.py** - Creates professional PDF with visualizations
5. **master_workflow.py** - Orchestrates all steps and moves files to final folder

## How to Use

### For New Month Processing
1. Download latest Google & Bing CSV exports
2. Update `config.json`:
   - Change `month` to new month (e.g., "2025-11")
   - Update `input_files` with actual downloaded filenames
3. Run: `python master_workflow.py`
4. Find reports in: `../YYYY-MM Ad Spend Reports/`

### Example
```bash
cd "Ads Report/Monthly Product Ad Spends/Ad Spend Processor Skill Files"
# Edit config.json with new month and filenames
python master_workflow.py
# Reports will be in: ../2025-11 Ad Spend Reports/
```

## What Was Removed
- Separate CSV exports (contained in Excel for analysis)
- Multiple temporary working files
- Cluttered output directory structure

## Key Features
✨ **100% Category Coverage** - All products categorized
✨ **Platform Comparison** - Side-by-side Google/Bing analysis
✨ **Professional Formatting** - Color-coded sheets, proper alignment
✨ **Complete Metrics** - ROAS, CPC, revenue, spend tracking
✨ **Vendor Intelligence** - Top performers and spend distribution
✨ **PDF Export** - Ready-to-share professional reports

## Notes
- Temporary working folder (`../2025-10`) is left for development reference but all final files are in the `../2025-10 Ad Spend Reports/` folder
- The skill processes ~2,000+ products per month
- All vendor categories maintained from source data
- Automatic detection of missing categories and SKU mappings
