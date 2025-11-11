# S4 Dashboard Processor - User Guide

**Version:** 1.0.0
**Created:** November 10, 2025
**Purpose:** Automate CBOS to Dashboard data processing workflow

---

## Overview

The S4 Dashboard Processor is a fully automated skill that transforms monthly CBOS Sales Order Detail exports into clean, formatted data ready for import into the Source 4 Industries main sales dashboard.

### What It Does

1. **Reads** the latest Sales Order Detail Excel file from the Monthly Imports folder
2. **Cleans** the data by removing metadata, filtering excluded rows, and organizing columns
3. **Enriches** data with Master SKU information (vendor, cost, categories)
4. **Calculates** all financial metrics (costs, profit margins, ROI)
5. **Validates** data quality and flags anomalies
6. **Exports** a multi-tab Excel file ready for dashboard import

### Key Features

- ✅ **Fully Automated** - Detects latest file, extracts month, processes without intervention
- ✅ **SKU Matching** - Normalizes SKUs for reliable Master SKU lookup
- ✅ **Financial Calculations** - Costs, invoice totals, profit, ROI
- ✅ **Smart Distribution** - Proportionally allocates shipping and discounts
- ✅ **State Processing** - Extracts abbreviations and regions (USA/Canada)
- ✅ **Quality Control** - 6 specialized tabs for data review and maintenance
- ✅ **Month Coding** - Generates tracked month codes (ZH, ZI, ZJ...)
- ✅ **Comprehensive Logging** - Tracks all processing steps

---

## How to Use

### Quick Start

1. **Place Input File**
   Save your CBOS Sales Order Detail export to:
   ```
   C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Dashboard\Monthly Imports\
   ```
   The file should be named something like: `Sales_Order_Detail1234567890.xlsx`

2. **Run the Processor**
   ```bash
   python dashboard_processor.py
   ```

3. **Check Output**
   The processed file will be created in the Dashboard folder:
   ```
   C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Dashboard\YYYY-MM_Dashboard_Import.xlsx
   ```

### What Gets Processed

The processor automatically:
- Finds the latest `Sales_Order_Detail*.xlsx` file in Monthly Imports
- Extracts the month from the first date in the data (YYYY-MM format)
- Processes all rows except:
  - Metadata rows (rows 1-11 in the raw export)
  - Rows with `c_order_c_activity_id` = "Projects"
  - Rows where Sales Rep is: KRISTI CROFFORD, MEL HEDGEPETH, or CURT ROSS

---

## Output File Structure

The generated Excel file contains **6 tabs**:

### Tab 1: READY TO IMPORT
**Purpose:** Clean data ready for direct dashboard import

**Contains:** All transaction rows with complete data (columns A-AD)

**Columns:**
- A: Customer
- B: Sales Rep
- C: Order Type (Online/Local)
- D: Year-Month (YYYY-MM)
- E: Date Ordered
- F: Order #
- G: SKU
- H: Product Name
- I: Order Quantity
- J: Sales Each
- K: Sales Total
- L: Cost Each
- M: Cost Total
- N: Vendor
- O: Orders (percentage)
- P: Shipping
- Q: Discount
- R: Total Lines
- S: Invoice Total
- T: Profit Total
- U: ROI
- V-X: Reserved
- Y: Year
- Z: Tracked Month
- AA: State
- AB: Region
- AC: User Email
- AD: Shipping Method

**Use:** Import directly into your sales dashboard

---

### Tab 2: MISSING COSTS
**Purpose:** Flag rows with missing or zero cost data

**Criteria:**
- Cost Each (Column L) is empty OR
- Cost Each = $0.00

**Action Required:** Add cost data to Master SKU sheet for these products

**Key Columns for Review:**
- Vendor
- SKU
- Product Name
- Sales Total
- Cost Each (blank)

---

### Tab 3: MISSING OVERALL CATEGORY
**Purpose:** Flag rows missing overall product category

**Criteria:**
- Overall Product Category is empty OR blank

**Action Required:** Assign overall category in Master SKU

**Key Columns for Review:**
- Vendor
- SKU
- Product Name
- Product Category
- Overall Product Category (blank)

---

### Tab 4: MISSING PRODUCT CATEGORY - MAIN VENDORS
**Purpose:** Flag main vendors missing specific product category

**Criteria:**
- Vendor is one of the 18 main vendors AND
- Product Category is empty or blank

**Main Vendors (18 total):**
- S4 Bollards
- Handle-It
- Casters
- Lincoln Industrial
- Noblelift
- B&P Manufacturing
- Dutro
- Reliance Foundry
- Ekko Lifts
- Adrian's Safety
- Sentry Protection
- Little Giant
- Merrick Machine
- Wesco
- Valley Craft
- Bluff Manufacturing
- Meco-Omaha
- Apollo Forklift

**Action Required:** Assign specific product category in Master SKU for detailed analysis

---

### Tab 5: HIGH MARGIN ALERT
**Purpose:** Flag rows with unusually high margins (potential data errors)

**Criteria:**
- ROI (Column U) > 70%

**Action Required:** Review pricing and cost accuracy. Possible issues:
- Missing cost data
- Incorrect unit prices
- Data entry errors

**Key Columns for Review:**
- Customer
- SKU
- Product Name
- Sales Total
- Cost Total
- Profit Total
- ROI (high %)

---

### Tab 6: NEGATIVE/ZERO MARGIN ALERT
**Purpose:** Flag unprofitable transactions

**Criteria:**
- ROI (Column U) ≤ 0%

**Action Required:** Review for profitability issues. Possible causes:
- Product sold below cost
- Discount applied incorrectly
- Pricing error

**Key Columns for Review:**
- Customer
- SKU
- Product Name
- Sales Total
- Cost Total
- Profit Total
- ROI (negative/zero %)

---

## Processing Steps Explained

### Step 1: File Upload & Initial Cleanup
- Reads Sales_Order_Detail export
- Removes metadata rows (1-11)
- Extracts month from date field

### Step 2: Delete Projects & Reorganize Columns
- Filters out "Projects" activity type
- Removes excluded sales reps
- Remaps columns to target structure (A-AD)
- Derives Order Type (Online/Local):
  - Sales Rep = "Michael Karuga" → Online
  - Order contains "#" → Online
  - Order starts with "C" → Online
  - Order starts with "SO" → Local

### Step 3: Calculate Orders, Shipping, Discounts & State Data
- Identifies shipping and discount line items by matching terms
- Consolidates shipping charges by invoice
- Consolidates discount charges by invoice
- Distributes charges proportionally to line items
- Extracts state abbreviations from addresses
- Determines region (USA or Canada)

**Shipping Terms Identified:**
- DELIVERY FEE
- FREIGHT CHARGED
- FREIGHT-NON TAX
- FREIGHT-Taxable
- SHIPPING CHARGED - NON-TAXABLE
- SHIPPING CHARGED - TAXABLE
- RESTOCKING FEE
- TAX, TARIFF, FREIGHT

**Discount Terms Identified:**
- DISCOUNT

### Step 4: SKU Normalization & Master Data Lookup
- Normalizes SKUs in both datasets:
  - Removes commas (123,456 → 123456)
  - Removes spaces
  - Removes trailing zeros (11872.0 → 11872)
  - Converts scientific notation (2.79E5 → 279000)
  - Converts to uppercase for case-insensitive matching
- Merges transaction data with Master SKU using normalized SKU_KEY
- All transactions retained (left join), unmatched marked as "NOT FOUND"

### Step 5: Cost Calculation, Vendor & Category Assignment
- **For matched SKUs:**
  - Extracts Cost Each from Master SKU
  - Calculates Cost Total = Qty × Cost Each
  - Assigns Vendor from Master SKU
  - Assigns Product Category from Master SKU
  - Assigns Overall Category from Master SKU

- **For unmatched SKUs:**
  - Sets Cost Each to empty
  - Sets Vendor to "NOT FOUND"
  - Sets categories to empty
  - Logs missing SKU for Master SKU maintenance

### Step 6: Create Unique Row Identifiers
- Generates unique key: `{SKU}_{InvoiceNumber}_{Index}`
- Assigns sequential row order
- Prevents duplicate rows in final import

### Step 7: Final Calculations & Formatting
All financial calculations:

| Field | Formula | Format | Example |
|-------|---------|--------|---------|
| Cost Total | Qty × Cost Each | Currency | $10,500.00 |
| Invoice Total | Sales + Shipping - Discount | Currency | $11,809.56 |
| Profit Total | Sales - Cost - Discount | Currency | $1,309.56 |
| ROI | Profit ÷ Invoice | Percentage | 11.1% |
| Year | Extracted from date | YYYY | 2025 |
| Tracked Month | Month code generator | Code | ZJ |

**Tracked Month Code:**
- Based on months since August 2025 (base = ZH)
- Pattern: Z + Letter (H, I, J, K, L...)
- Before Aug 2025 defaults to ZH

| Month | Code |
|-------|------|
| Aug 2025 | ZH |
| Sep 2025 | ZI |
| Oct 2025 | ZJ |
| Nov 2025 | ZK |
| Dec 2025 | ZL |

### Step 8: Quality Control Checks
Creates 5 filtered tabs for data review:
1. Missing costs (for Master SKU updates)
2. Missing overall categories
3. Missing main vendor categories
4. High margin alerts (>70%)
5. Negative/zero margin alerts (≤0%)

### Step 9: Final Export
- Creates multi-tab Excel file
- Filename format: `YYYY-MM_Dashboard_Import.xlsx`
- Location: `Dashboard/` folder
- Ready for direct import

---

## Troubleshooting

### Common Issues

**"No Sales_Order_Detail files found"**
- Ensure file is in correct folder: `Dashboard/Monthly Imports/`
- Check filename matches pattern: `Sales_Order_Detail*.xlsx`
- Verify file is not open in Excel or another program

**"Master SKU file not found"**
- File location: `SKU Documents/Google Ads - Product Spend - MASTER SKU (1).csv`
- Ensure filename is exactly as specified (including spaces and parentheses)
- Verify file is not open in another program

**"Large number of unmatched SKUs"**
- This is normal for new products
- Check MISSING COSTS tab for products needing Master SKU entries
- Add SKUs to Master SKU file and re-run processor

**"High or negative margins detected"**
- Check HIGH MARGIN ALERT and NEGATIVE/ZERO MARGIN ALERT tabs
- Review cost data accuracy in Master SKU
- Verify pricing hasn't been discounted incorrectly

### Log Files

The processor creates a log file: `dashboard_processor.log`

Check this file for:
- Detailed processing steps
- Error messages
- SKU matching statistics
- Data validation details

---

## Master SKU File

The processor requires: `Google Ads - Product Spend - MASTER SKU (1).csv`

**Required Columns:**
- SKU (or Search Key) - must be in first column
- VENDOR - vendor name
- COST - unit cost (can have $ prefix)
- PRODUCT CATEGORY - specific product category
- OVERALL PRODUCT CATEGORY - high-level category

**Maintenance:**
When processing flags issues, update Master SKU:

| Tab | Action |
|-----|--------|
| MISSING COSTS | Add unit cost for products |
| MISSING OVERALL CATEGORY | Add overall category |
| MISSING PRODUCT CATEGORY - MAIN VENDORS | Add specific product category |

---

## Configuration

Edit `dashboard_config.json` to customize:

- **excluded_sales_reps** - Sales reps to filter out
- **shipping_terms** - Terms that identify shipping line items
- **discount_terms** - Terms that identify discount line items
- **high_margin_threshold** - Percentage for high margin alerts (default: 70%)
- **main_vendors** - List of primary vendors with categories

---

## Automation & Scheduling

To run automatically each month:

### Windows Task Scheduler
```
Program: C:\Python\python.exe
Arguments: C:\Users\blkw\...\Ads Report\Dashboard\dashboard_processor.py
Trigger: Monthly (1st day of month at 8:00 AM)
```

### Manual Run via Command Line
```bash
cd "C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Dashboard"
python dashboard_processor.py
```

---

## Column Reference

| Column | Name | Source | Notes |
|--------|------|--------|-------|
| A | Customer | CBOS | Business Partner name |
| B | Sales Rep | CBOS | Sales representative |
| C | Order Type | Derived | Online/Local based on order patterns |
| D | Year-Month | Derived | YYYY-MM format from date |
| E | Date Ordered | CBOS | Full order date |
| F | Order # | CBOS | Invoice/Order number |
| G | SKU | CBOS | Product Search Key (normalized) |
| H | Product Name | CBOS | Product description |
| I | Order Quantity | CBOS | Quantity ordered |
| J | Sales Each | CBOS | Unit price |
| K | Sales Total | CBOS | Line amount |
| L | Cost Each | Master SKU | Unit cost |
| M | Cost Total | Calculated | Qty × Cost Each |
| N | Vendor | Master SKU | Vendor name |
| O | Orders | Calculated | Line % of invoice total |
| P | Shipping | Calculated | Proportional shipping |
| Q | Discount | Calculated | Proportional discount |
| R | Total Lines | CBOS | Line count per invoice |
| S | Invoice Total | Calculated | Sales + Shipping - Discount |
| T | Profit Total | Calculated | Sales - Cost - Discount |
| U | ROI | Calculated | Profit ÷ Invoice (%) |
| V-X | Reserved | - | For future use |
| Y | Year | Derived | YYYY |
| Z | Tracked Month | Derived | ZH, ZI, ZJ... code |
| AA | State | Derived | 2-letter state/province |
| AB | Region | Derived | USA or Canada |
| AC | User Email | CBOS | Order user email |
| AD | Shipping Method | CBOS | Shipper ID |

---

## Support & Updates

**Version History:**
- 1.0.0 (Nov 10, 2025) - Initial release

**Contact:** Claude Code implementation

For issues or feature requests, check the log file and review the troubleshooting section above.

---

## Technical Notes

### Technology Stack
- Python 3.7+
- pandas - Data manipulation
- openpyxl - Excel file handling
- datetime - Date processing

### Performance
- Processes typical monthly exports (5,000-6,000 rows) in 30-60 seconds
- Memory efficient with streaming where possible
- Optimized for Windows file paths

### Data Integrity
- All original transactions preserved in final output
- Unique row identifiers prevent duplicates
- Row order maintained throughout processing
- Quality control tabs identify all issues without filtering data

---

End of documentation
