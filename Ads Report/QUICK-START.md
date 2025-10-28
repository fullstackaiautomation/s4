# Quick Start Guide

## One-Time Setup

1. Navigate to the Ads Report directory
2. Install dependencies:
   ```bash
   npm install
   ```

## Monthly Workflow

### Option 1: Interactive Menu (Easiest)

```bash
npm run process-all "path/to/google-ads-file.xlsx" "path/to/cbo-file.xlsx"
```

Then follow the on-screen menu.

### Option 2: Step-by-Step

#### Step 1: Clean the data
```bash
npm run clean-data "path/to/google-ads-file.xlsx"
```
✅ Adds month, platform, and product categories

#### Step 2: Find missing SKUs
```bash
npm run find-missing-skus "path/to/google-ads-file.xlsx"
```
✅ Adds VLOOKUP formulas for missing SKUs

**⏸ PAUSE: Open Excel, let formulas calculate, save, close**

#### Step 3: Check for errors
```bash
node src/find-missing-skus.js "path/to/google-ads-file.xlsx" check
```
✅ Lists any missing SKUs to look up

If you see missing SKUs:
1. Add titles to ALL SKUS sheet
2. Look up SKUs on source4industries.com
3. Fill in SKU and Vendor columns
4. Run step 3 again

#### Step 4: Merge with CBO export
```bash
npm run merge-cbo "path/to/google-ads-file.xlsx" "path/to/cbo-file.xlsx"
```
✅ Updates ad spend in CBO export

#### Step 5: Handle remaining vendors
```bash
npm run remaining-vendors "path/to/google-ads-file.xlsx" "path/to/cbo-file.xlsx"
```
✅ Processes vendors from ALL MONTHS tab

## File Locations

Replace these paths with your actual file locations:

- **Google Ads file**: `GOOGLE ADS- PRODUCT SPEND.xlsx`
- **CBO file**: `CBOS TO DASH MONTHLY EXPORT.xlsx`

Example with full Windows paths:
```bash
npm run process-all "C:\Users\blkw\Downloads\GOOGLE ADS- PRODUCT SPEND.xlsx" "C:\Users\blkw\Downloads\CBOS TO DASH MONTHLY EXPORT.xlsx"
```

## What to Check After Each Step

### After Step 1 (Clean Data)
- Open Excel and verify:
  - Column K has month letters (ZF, ZG, etc.)
  - Column L has month names (JUNE 25, JULY 25, etc.)
  - Column M shows GOOGLE or BING
  - Column N has product categories

### After Step 2 (Find Missing SKUs)
- Open Excel and wait for formulas to calculate
- Check columns A and B for #N/A errors
- Save and close Excel

### After Step 3 (Check Errors)
- Terminal shows any titles that need SKUs
- If none, you're good to proceed
- If some, add them to ALL SKUS sheet

### After Step 4 (Merge CBO)
- Open CBO file and verify:
  - Ad spend (column H) updated for vendors
  - New yellow rows for categories with ads but no sales
  - Totals match (check terminal output)

### After Step 5 (Remaining Vendors)
- Check that all vendors from ALL MONTHS are in CBO file
- Verify ad spend totals

## Common Issues

**"File not found"**
- Check your file path is correct
- Use quotes around paths with spaces

**"Sheet not found"**
- Verify your Excel has ALL SKUS sheet
- Verify vendor names match between files

**Formulas not calculating**
- You MUST open Excel after Step 2
- Wait for calculations to complete
- Save before closing

## Output Colors

- 🔵 Blue = Info messages
- 🟢 Green = Success
- 🟡 Yellow = Warnings / action needed
- 🔴 Red = Errors

## Need Help?

See [AUTOMATION-README.md](AUTOMATION-README.md) for full documentation.
