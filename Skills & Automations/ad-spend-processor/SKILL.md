---
name: s4-ad-spend-processor
description: Monthly advertising data processing for Source 4 Industries. Processes Google Ads and Bing Ads CSV exports, combines data, auto-suggests categories with confidence scores, detects missing SKUs, and generates vendor/category spend analysis. Use when processing monthly ad spend, assigning product categories, reconciling SKUs, or generating spend reports.
---

# Ad Spend Processor

Automates your monthly Google Ads + Bing Ads processing workflow with smart categorization, vendor assignment, and spend reporting.

## Monthly Workflow

1. **Load & Clean** - Import Google Ads and Bing Ads CSVs, standardize columns
2. **Combine Data** - Merge platforms, remove duplicates
3. **Find Missing SKUs** - Detect any SKUs not in your MASTER SKU
4. **Auto-Suggest Categories** - Generate suggestions with confidence scores
5. **Review & Approve** - Validate high/medium confidence items
6. **Generate Reports** - Create spend analysis by vendor and category
7. **Export Upload Sheet** - Generate formatted CSV for monthly upload

> **Key:** Load MASTER SKU for maximum accuracy. Without it, the skill assigns vendors from SKU patterns and titles only.

---

## **REQUIRED: Monthly Upload Sheet Format**

### File Naming Convention
**Every month requires creating:** `YYYY-MM Product Spend Upload.csv`

**Examples:**
- `2025-10 Product Spend Upload.csv`
- `2025-11 Product Spend Upload.csv`

### Upload Sheet Template

The upload sheet must contain exactly these columns in this order:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Month | Platform | Product Category | SKU | Title | Vendor | Price | Ad Spend | Impressions | Clicks | CTR | Avg. CPC | Conversions | Revenue | Impression share | Impression share lost to rank | Absolute top impression share |

### Column Formatting Requirements

| Column | Alignment | Format | Example |
|--------|-----------|--------|---------|
| Month | Center | YYYY-MM | 2025-10 |
| Platform | Center | Text | Bing Ads / Google Ads |
| Product Category | Center | Text | Electric Pallet Jacks |
| SKU | Center | Text | EK25GB |
| Title | **LEFT** | Text | EKKO EK25GB Electric Forklift... |
| Vendor | Center | Text | Ekko Lifts |
| Price | Center | Currency | $30,799.00 |
| Ad Spend | Center | Currency | $21.59 |
| Impressions | Center | Number (no decimals) | 7,145 |
| Clicks | Center | Number (no decimals) | 33 |
| CTR | Center | Percentage | 0.46% |
| Avg. CPC | Center | Currency | $0.65 |
| Conversions | Center | Number | 0.00 (or blank if zero) |
| Revenue | Center | Currency | $0.00 (or blank if zero) |
| Impression share | Center | Percentage | 39.32% (or blank if N/A) |
| Impression share lost to rank | Center | Percentage | 19.34% (or blank if N/A) |
| Absolute top impression share | Center | Percentage | 9.19% (or blank if N/A) |

### Critical Formatting Rules

✓ **DO:**
- Always use YYYY-MM format for month (e.g., 2025-10)
- Always include % sign in percentages (e.g., 0.46%, not .46)
- Always include $ in currency values
- Center-align all columns EXCEPT Title (left-align Title)
- Use 2 decimal places for currency ($XX.XX)
- Use 2 decimal places for conversions/revenue (unless zero, then blank)
- Use NO decimal places for impressions and clicks (whole numbers only)

✗ **DON'T:**
- Use month names (October, Oct, etc.) - only YYYY-MM
- Omit % or $ symbols
- Forget to left-align Title column
- Include decimals in impression/click counts
- Leave cells with 0 for conversions or revenue - leave blank instead
- Use "--, N/A, or 0" for impression share fields - leave blank

### Header Row Styling

- **Row 1:** Frozen header row
- **Font:** Bold, colored background (see Google Sheet example)
- **Colors used:** Orange (Ad Spend), Green (Conversions), Blue (SKU), Cyan (Impressions)

---

## How to Use

### Monthly Processing (Automated Workflow)

For the easiest experience, simply tell Claude Code:

```
I'm ready to process [MONTH] ad spend.
Google export: [filename]
Bing export: [filename]
```

Or even simpler:

```
Process November 2025 ad spend.
```

Claude Code will:
1. Update `config.json` with month and filenames
2. Run the master workflow script
3. Generate all reports in minutes
4. Report any data issues

**No manual script updates needed!**

### Configuration-Based Processing

The system now uses `config.json` for automatic configuration:

```json
{
  "month": "2025-11",
  "input_files": {
    "google": "Product report (1).csv",
    "bing": "7765305030076.csv"
  }
}
```

Just update month and filenames, then run: `python master_workflow.py`

### Manual Processing (If Needed)

If you need to process locally without Claude:

```bash
cd "Monthly Product Ad Spends"
python master_workflow.py
```

This runs all 4 processing scripts in sequence and generates complete reports.

### Category Assignment Only

If you only need suggestions for products with blank categories:

```
Suggest categories for blank items in master_sku.csv
Use my vendor_category_cheat_sheet for reference
```

### Missing SKU Detection

```
Check if any SKUs from google_ads.csv and bing_ads.csv are missing from master_sku.csv
```

## Data Mapping Specifications

### Bing Ads CSV Format

| Column | Source | Format | Notes |
|--------|--------|--------|-------|
| Month | - | YYYY-MM | Always formatted as YYYY-MM (e.g., 2025-10) |
| Platform | - | Bing Ads | Static value |
| SKU | Custom label 1 (Product) | Text | If blank, use Merchant product ID |
| Product Category | Derived | Text | Based on SKU lookup (see categorization rules) |
| Title | Title | Text | As-is from upload |
| Vendor | Brand | Text | Proper formatting (e.g., Handle-It, Durable Superior Casters) |
| Price | Price | Currency | $ formatting |
| Ad Spend | Spend | Currency | $ formatting |
| Impressions | Impressions | Number | No decimals |
| Clicks | Clicks | Number | No decimals |
| CTR | CTR | Percentage | % formatting (e.g., 0.46% not .46) |
| Avg. CPC | Avg. CPC | Currency | $ formatting |
| Conversions | Conversions | Number | 2 decimals unless zero (then no decimals) |
| Revenue | Revenue | Currency | $ formatting |
| Impression share | Impression share | Percentage | % formatting |
| Impression share lost to rank | Impression share lost to rank | Percentage | % formatting |
| Absolute top impression share | Absolute top impression share | Percentage | % formatting |

**Formatting Notes:**
- Center all columns except Title
- Title column: left-aligned

### Google Ads CSV Format

| Column | Source | Format | Notes |
|--------|--------|--------|-------|
| Month | - | YYYY-MM | Always formatted as YYYY-MM (e.g., 2025-10) |
| Platform | - | Google Ads | Static value |
| SKU | Custom label 1 | Text | If blank, use Item ID to lookup custom label 1 in ID to SKU tab. If not found, add to SKU audit list |
| Product Category | Derived | Text | Based on SKU lookup (see categorization rules) |
| Title | Title | Text | As-is from upload |
| Vendor | Brand | Text | Proper formatting (e.g., Handle-It, Durable Superior Casters) |
| Price | Price | Currency | $ formatting |
| Ad Spend | Cost | Currency | $ formatting |
| Impressions | Impr. | Number | No decimals |
| Clicks | Clicks | Number | No decimals |
| CTR | CTR | Percentage | % formatting (e.g., 1.95% not 1.95) |
| Avg. CPC | Avg. CPC | Currency | $ formatting |
| Conversions | Conversions | Number | 2 decimals unless zero (then no decimals) |
| Revenue | Conv. value | Currency | $ formatting |
| Impression share | Search impr. share | Percentage | % formatting; leave blank if "--" |
| Impression share lost to rank | Search lost IS (rank) | Percentage | % formatting; leave blank if "--" |
| Absolute top impression share | Search abs. top IS | Percentage | % formatting; leave blank if "--" |

**Formatting Notes:**
- Center all columns except Title
- Title column: left-aligned
- Leave blank cells if source shows "--"

## What Gets Generated

### Primary Output Files

1. **YYYY-MM Product Spend Upload.csv** - Main upload sheet with:
   - All 17 columns per specification (Month, Platform, Product Category, SKU, Title, Vendor, Price, Ad Spend, Impressions, Clicks, CTR, Avg. CPC, Conversions, Revenue, Impression share, Impression share lost to rank, Absolute top impression share)
   - Platform names: "Bing" or "Google" (not "Bing Ads" or "Google Ads")
   - SKU in UPPERCASE formatting
   - Product Categories looked up from MASTER SKU via SKU
   - Summary rows removed from source data
   - All data formatting per specifications above
   - 835 products (October 2025 example)

### Excel Report File

2. **YYYY-MM Product Spend Report.xlsx** - Multi-sheet professional Excel workbook:

   **Sheet 1: Summary Report** - Executive dashboard with 5 analysis sections:
   - Top 20 Products by Ad Spend (table + chart)
     * Shows highest spending products with revenue and ROAS metrics
   - Top 20 Products by Revenue (table + chart)
     * Identifies best revenue-generating products
   - Top 20 Highest CPC by SKU (table + chart)
     * Reveals most expensive click costs for optimization
   - Top 20 Vendors by Ad Spend (table + chart)
     * Vendor performance ranking with ROAS
   - Top 20 Product Categories with Vendor Details (table + chart)
     * Category-level spend and revenue analysis

   **Sheet 2: Product Spend Upload**
   - All 835+ products with clean formatting
   - Header row with proper styling
   - Column widths optimized for readability

   **Sheet 3: Missing Categories**
   - Products without proper category assignments
   - Shows vendor, SKU, and title for research

   **Sheet 4: Vendor Breakdown**
   - Row 1: Summary totals (Total Ad Spend, Total Revenue)
   - Row 2: Column headers (Ad Spend, Revenue)
   - All 18 main vendors with category-level breakdown
   - "All Other Vendors" section sorted by spend descending
   - Each vendor shows all applicable categories
   - Category-level spend and revenue totals

### PDF Report File

3. **YYYY-MM Ad Spend Performance Report.pdf** - Professional 6-page PDF report:

   **Page 1: Title Page with Executive Summary**
   - Report title and date
   - Key metrics table:
     * Total Ad Spend
     * Total Revenue
     * Overall ROAS
     * Total Products
     * Total Vendors

   **Pages 2-6: Analysis Sections** (each with full-width table + chart)
   - Top 20 Products by Ad Spend
   - Top 20 Products by Revenue
   - Top 20 Highest CPC by SKU
   - Top 20 Vendors by Ad Spend
   - Top 20 Product Categories with Vendor Details

   **Design Features:**
   - Professional dark blue headers (#1F4E78)
   - Full-width tables matching section header width
   - Product titles truncated to 32 characters
   - Alternating row colors (white/light gray)
   - Horizontal bar charts with value labels
   - Proper spacing and margins throughout

### Audit Files (for data reconciliation)

4. **YYYY-MM Missing SKUs.csv** - Products without SKU assignments:
   - Columns: Vendor, Product Name, Source
   - Lists all products that could not be assigned a SKU
   - For Bing: Custom label 1 and Merchant product ID both missing/invalid
   - For Google: Custom label 1 blank and Item ID not found in ID to SKU lookup
   - Action required: Research and provide SKU for these products

5. **YYYY-MM Missing Product Categories.csv** - Products with incomplete categorization:
   - Columns: All columns from upload sheet
   - Lists all products where SKU was found but Product Category is blank
   - Includes both main vendors (18) and other vendors
   - Action required: Research and assign category using vendor category guide

## Understanding Confidence Scores

- **HIGH (≥70%)** - Strong keyword matches, likely correct
- **MEDIUM (40-69%)** - Partial matches, validate before approving
- **LOW (<40%)** - Weak signals, needs manual review

**Pro tip:** Review HIGH confidence suggestions first—even 90% should be validated.

## 18 Main Vendors & Categories

### Primary Vendors (with category breakdowns)

| Vendor | Categories | SKU Pattern |
|--------|------------|------------|
| Lincoln Industrial | 6 | `1426-*` |
| Durable Superior Casters | 6 | `01HR*`, `01PO*` |
| Ekko Lifts | 5 | `E50*` |
| Handle-It | 5 | Title keyword |
| Noblelift | 7 | Title keyword |
| S4 Bollards | 6 | Title keyword |
| Reliance Foundry | 8 | Title keyword |
| B&P Manufacturing | 6 | Title keyword |
| Little Giant | 6 | Title keyword |
| Wesco | 6 | Title keyword |
| Valley Craft | 6 | Title keyword |
| Dutro | 6 | Title keyword |
| Merrick Machine | 6 | Title keyword |
| Bluff Manufacturing | 6 | Title keyword |
| Meco-Omaha | 6 | Title keyword |
| Apollo Forklift | 6 | Title keyword |
| Adrian's Safety | 3 | Title keyword |
| Sentry Protection | 3 | Title keyword |

**Total:** 113 categories across 18 main vendors

### Other Vendors (Summary Spend Only)

For vendors outside the main 18, report total ad spend by vendor name without category breakdown. Examples include:
- Kee Safety
- Composite Technologies Inc.
- Nelson
- DH International
- Colson
- [Additional vendors as discovered in data]

**Note:** Main vendors receive full category analysis; other vendors show total spend only.

See `references/vendor_category_guide.md` for complete category list.

## Implementation Notes

### Processing Pipeline

1. **Data Cleaning** (`scripts/process_ad_data.py`)
   - Load Bing and Google CSV files
   - Apply format specifications (dates, currency, percentages, numbers)
   - Extract SKU from primary and fallback sources
   - Lookup missing SKUs in ID to SKU mapping
   - Flag SKUs not found for audit list
   - Vendor name standardization with proper formatting

2. **Categorization** (`scripts/categorize_vendors.py`)
   - Assign product categories based on SKU lookup
   - Generate confidence scores (HIGH/MEDIUM/LOW)
   - Create category_suggestions.csv with all fields per spec
   - Validate against vendor_category_guide.md

3. **Report Generation** (`scripts/generate_reports.py`)
   - Create combined_ad_data.csv with all standardized fields
   - Generate monthly_ad_spend_report.xlsx with multiple sheets
   - Produce vendor_spend_summary.csv for quick reference
   - Identify and report missing SKUs separately

### Key Rules

- **Month Format:** Always YYYY-MM (e.g., 2025-10)
- **SKU Priority:** Custom label 1 > Merchant ID (Bing) | Custom label 1 > Item ID lookup (Google)
- **Vendor Formatting:** Proper case (Handle-It, Durable Superior Casters, etc.)
- **Percentage Values:** Always include % sign (e.g., 0.46%, not .46)
- **Currency:** Always include $ sign with 2 decimal places
- **Numbers:** No decimals for counts (impressions, clicks), 2 decimals for conversions
- **Main Vendors:** 18 primary vendors get full category breakdown
- **Other Vendors:** All other vendors show total ad spend only (no category breakdown)
- **Text Alignment:** Title left-aligned; all other columns center-aligned

### Export Format

All outputs must follow the specifications in "Data Mapping Specifications" section:
- Column order as specified
- Formatting rules strictly applied
- Blank cells for missing data (not N/A or 0)
- UTF-8 encoding for CSV files
- Excel format for multi-sheet reports

---

## Recent Enhancements (October 2025)

### New Report Generation Features

**Excel Report Updates:**
- Added Summary Report sheet with executive analysis
- Vendor Breakdown sheet now shows category-level details for all 18 main vendors
- Revenue totals and ROAS metrics throughout all sheets
- All Other Vendors section sorted by ad spend descending

**PDF Report Creation:**
- Professional 6-page PDF report with executive summary
- 5 detailed analysis sections with tables and charts:
  * Top 20 products by ad spend
  * Top 20 products by revenue
  * Top 20 highest CPC by SKU
  * Top 20 vendors by ad spend
  * Top 20 categories with vendor details
- Full-width tables matching section header width
- Product titles truncated to 32 characters for clean display
- Professional design with dark blue headers and alternating row colors
- Horizontal bar charts with value labels for quick visualization

**Data Processing Improvements:**
- Ekko Lifts now includes "Manual Pallet Jacks" category
- Proper ROAS calculation (Revenue / Ad Spend) throughout all reports
- Vendor consolidation: Caster Depot, Dh International, Durable Superior Casters grouped as "Casters"
- Colson vendor mapped to Caster Depot
- All missing categories resolved through improved SKU lookup with 3-stage fallback:
  1. Direct Custom label 1 lookup
  2. Item ID to SKU with base ID parsing (handles `/h.it/new` and `|bsmay` suffixes)
  3. Product title exact match in Master SKU

**File Outputs:**
- Process creates 3 CSV files: Upload sheet, Missing Categories, Missing SKUs
- Excel workbook with 4 sheets for comprehensive analysis
- Professional PDF report for executive review
- All October 2025 example: 835 products, $3,663.54 total spend, $16,364.33 total revenue
