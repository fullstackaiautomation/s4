# Google Ads Report Processing Automation

Automated tools for cleaning, processing, and merging Google Ads product spend data with CBO exports.

## Overview

This automation suite handles the entire workflow for monthly Google Ads reporting:

1. **Clean Data** - Add month data, platform, and product categories
2. **Find Missing SKUs** - Identify and create VLOOKUP formulas for missing SKU/vendor data
3. **Check #N/A Errors** - Validate all lookups succeeded
4. **Merge CBO Data** - Add ad spend to CBO export by vendor and category
5. **Handle Remaining Vendors** - Process vendors from ALL MONTHS tab

## Installation

```bash
npm install
```

This installs:
- `exceljs` - Excel file manipulation
- `chalk` - Colored terminal output
- `ora` - Loading spinners

## Quick Start

### Interactive Menu (Recommended)

Run the interactive menu to step through the workflow:

```bash
npm run process-all "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx" "path/to/CBOS TO DASH MONTHLY EXPORT.xlsx"
```

Or with full paths:

```bash
node src/process-all.js "C:\Users\blkw\Downloads\GOOGLE ADS- PRODUCT SPEND.xlsx" "C:\Users\blkw\Downloads\CBOS TO DASH MONTHLY EXPORT.xlsx"
```

### Individual Scripts

You can also run each step individually:

#### Step 1: Clean Data

Adds month data (columns K-L), platform (column M), and extends product category formulas (column N).

```bash
npm run clean-data "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx"
```

#### Step 2: Find Missing SKUs

Finds blank SKUs and adds VLOOKUP formulas to look them up in the ALL SKUS sheet.

```bash
npm run find-missing-skus "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx"
```

**After this step:** Open Excel, let formulas calculate, save, and close.

#### Step 3: Check #N/A Errors

After Excel calculates the VLOOKUP formulas, check for #N/A errors (SKUs not found).

```bash
node src/find-missing-skus.js "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx" check
```

If #N/A errors are found:
1. Copy the titles listed in the output
2. Paste into the ALL SKUS tab in the spreadsheet
3. Look up missing SKUs on source4industries.com
4. Fill in SKU and Vendor columns
5. Save the file
6. Run this step again to verify

#### Step 4: Merge CBO Data

Adds ad spend from Google Ads to the CBO export, organized by vendor and product category.

```bash
npm run merge-cbo "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx" "path/to/CBOS TO DASH MONTHLY EXPORT.xlsx"
```

This will:
- Update ad spend for existing vendor/category combinations
- Insert new rows (highlighted yellow) for categories with ad spend but no sales
- Validate totals match between files

#### Step 5: Handle Remaining Vendors

Process vendors from the ALL MONTHS tab (vendors without product category breakdowns).

```bash
npm run remaining-vendors "path/to/GOOGLE ADS- PRODUCT SPEND.xlsx" "path/to/CBOS TO DASH MONTHLY EXPORT.xlsx"
```

## Configuration

### Month Mappings

Edit [src/config.js](src/config.js) to update month letter codes:

```javascript
export const MONTH_MAPPINGS = {
  'JUNE 2025': { letter: 'ZF', short: 'JUNE 25' },
  'JULY 2025': { letter: 'ZG', short: 'JULY 25' },
  // ... add more months as needed
};
```

### Vendor Lists

Main vendors with product categories are defined in `MAIN_VENDORS`:

```javascript
export const MAIN_VENDORS = [
  'HANDLE IT',
  'CASTERS',
  'LINCOLN',
  // ... etc
];
```

Caster sub-vendors are grouped:

```javascript
export const CASTER_VENDORS = [
  'DURABLE',
  'DH INTERNATIONAL',
  'CASTER DEPOT'
];
```

## Workflow Details

### What Each Step Does

#### 1. Clean Data
- Adds month letter code (column K) based on report date
- Adds month short name (column L)
- Adds platform (column M): GOOGLE or BING based on sheet name
- Extends product category formula from column N down to all rows

#### 2. Find Missing SKUs
- Scans for blank or missing SKUs (empty, `-`, `--`)
- Adds VLOOKUP formulas:
  - Column A: `=VLOOKUP(C{row},'ALL SKUS'!A:C,2,FALSE)` for SKU
  - Column B: `=VLOOKUP(C{row},'ALL SKUS'!A:C,3,FALSE)` for Vendor

#### 3. Check #N/A Errors
- Identifies SKUs not found in ALL SKUS sheet
- Lists titles that need to be added to ALL SKUS
- Checks for missing product categories

#### 4. Merge CBO Data
- Calculates total ad spend by vendor and product category
- Matches to existing rows in CBO export
- Updates ad spend (column H)
- Inserts new rows for categories with ads but no sales (highlighted yellow)
- Validates totals match

#### 5. Handle Remaining Vendors
- Processes vendors from ALL MONTHS tab
- Updates total ad spend for each vendor
- Inserts new rows for vendors with no sales

## File Structure

```
Ads Report/
├── src/
│   ├── config.js                    # Configuration and constants
│   ├── clean-data.js                # Step 1: Clean data
│   ├── find-missing-skus.js         # Steps 2-3: SKU lookups
│   ├── merge-cbo-data.js            # Step 4: Merge CBO data
│   ├── handle-remaining-vendors.js  # Step 5: Remaining vendors
│   └── process-all.js               # Interactive menu and full workflow
├── package.json                     # Dependencies and scripts
└── AUTOMATION-README.md            # This file
```

## Troubleshooting

### ExcelJS doesn't calculate formulas

ExcelJS can write formulas but doesn't execute them. After step 2, you must:
1. Open the Excel file
2. Wait for formulas to calculate
3. Save the file
4. Close Excel
5. Continue to step 3

### "Sheet not found" errors

Check that your Excel file has sheets named:
- "ALL SKUS" for SKU lookups
- "ALL MONTHS" for remaining vendors
- Vendor-specific sheets matching vendor names

### Column indices wrong

If your spreadsheet has different columns, update the `COLUMNS` object in [src/config.js](src/config.js):

```javascript
export const COLUMNS = {
  SKU: 0,           // Column A (0-based index)
  VENDOR: 1,        // Column B
  TITLE: 2,         // Column C
  // ... etc
};
```

### Yellow highlighting not showing

The script uses Excel's color format. Light yellow is `FFFFFF00` in ARGB format. You can adjust in [src/config.js](src/config.js).

## Tips

### Backup Your Files

Always keep backup copies of your original spreadsheets before running automation.

### Run Steps Individually First

Before using the full workflow, run each step individually to understand what happens at each stage.

### Check Results

After each step, open the Excel file and verify the changes look correct.

### Validation

The merge steps include validation that totals match. Pay attention to any warnings about mismatches.

## Advanced Usage

### Custom Date Range

By default, scripts use the current month. To specify a different month:

```javascript
// In your script
import { cleanData } from './src/clean-data.js';

cleanData('path/to/file.xlsx', {
  monthMapping: {
    letter: 'ZF',
    short: 'JUNE 25'
  }
});
```

### Export Reports Programmatically

You can import and use the functions in your own Node.js scripts:

```javascript
import { cleanData } from './src/clean-data.js';
import { findMissingSkus } from './src/find-missing-skus.js';
import { mergeCboData } from './src/merge-cbo-data.js';

// Your custom workflow
await cleanData(googleAdsFile);
await findMissingSkus(googleAdsFile);
// ... manual step ...
await mergeCboData(googleAdsFile, cboFile);
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in the terminal (they're color-coded)
3. Verify your Excel file structure matches expectations
4. Check that all required sheets exist

## Future Enhancements

Potential improvements:
- [ ] Web scraper for automatic SKU lookup on source4industries.com
- [ ] Excel macro to trigger formula calculation automatically
- [ ] Email notifications when workflow completes
- [ ] Google Sheets integration
- [ ] Automated report generation
- [ ] Historical data tracking
- [ ] Dashboard for visualizing trends

## License

ISC
