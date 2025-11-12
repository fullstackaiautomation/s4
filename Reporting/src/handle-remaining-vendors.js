/**
 * Handle Remaining Vendors Script
 * Process vendors in ALL MONTHS tab (no product categories needed)
 */

import ExcelJS from 'exceljs';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Get total ad spend by vendor from Google Ads file (all months tab)
 */
async function getTotalAdSpendByVendor(googleAdsFilePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(googleAdsFilePath);

  // Look for "All Months" or similar tab
  const allMonthsSheet = workbook.worksheets.find(
    ws => ws.name.toUpperCase().includes('ALL MONTHS') ||
          ws.name.toUpperCase().includes('ALLMONTHS')
  );

  if (!allMonthsSheet) {
    throw new Error('ALL MONTHS sheet not found in Google Ads file');
  }

  const vendorSpend = {};

  // Process each row
  allMonthsSheet.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return; // Skip header

    const vendor = row.getCell(2).value?.toString().trim(); // Column B
    const adSpend = parseFloat(row.getCell(8).value) || 0; // Column H

    if (vendor && adSpend > 0) {
      if (!vendorSpend[vendor]) {
        vendorSpend[vendor] = 0;
      }
      vendorSpend[vendor] += adSpend;
    }
  });

  return vendorSpend;
}

/**
 * Find vendor in CBO export
 */
function findVendorInCbo(worksheet, vendor) {
  let foundRows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return;

    const rowVendor = row.getCell(2).value?.toString().trim(); // Column B

    if (rowVendor && rowVendor.toUpperCase() === vendor.toUpperCase()) {
      foundRows.push({
        rowNumber,
        vendor: rowVendor,
        adSpend: parseFloat(row.getCell(8).value) || 0
      });
    }
  });

  return foundRows;
}

/**
 * Update ad spend for vendor
 */
function updateVendorAdSpend(worksheet, vendorRows, totalAdSpend) {
  if (vendorRows.length === 0) return 0;

  // For simplicity, put all ad spend in first row for this vendor
  // Or distribute proportionally if there are multiple rows
  const firstRow = vendorRows[0];
  const row = worksheet.getRow(firstRow.rowNumber);

  row.getCell(8).value = totalAdSpend; // Column H

  return 1;
}

/**
 * Insert new row for vendor with no sales
 */
function insertVendorRow(worksheet, vendor, adSpend, insertAfterRow) {
  const newRow = worksheet.insertRow(insertAfterRow + 1);

  // Set vendor name
  newRow.getCell(2).value = vendor; // Column B

  // Set ad spend
  newRow.getCell(8).value = adSpend; // Column H

  // Color the row light yellow
  newRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }
    };
  });

  return newRow;
}

/**
 * Process remaining vendors
 */
async function handleRemainingVendors(googleAdsFile, cboFile) {
  const spinner = ora('Processing remaining vendors...').start();

  try {
    // Get ad spend totals from Google Ads
    spinner.text = 'Reading ad spend from ALL MONTHS tab...';
    const vendorSpend = await getTotalAdSpendByVendor(googleAdsFile);
    spinner.succeed(`Found ${Object.keys(vendorSpend).length} vendors in ALL MONTHS`);

    // Display summary
    console.log(chalk.blue('\n=== Vendor Ad Spend (ALL MONTHS) ==='));
    Object.entries(vendorSpend).forEach(([vendor, spend]) => {
      console.log(chalk.gray(`${vendor}: $${spend.toFixed(2)}`));
    });

    // Open CBO file
    const cboWorkbook = new ExcelJS.Workbook();
    await cboWorkbook.xlsx.readFile(cboFile);
    const cboSheet = cboWorkbook.getWorksheet(1);

    let totalUpdated = 0;
    let totalInserted = 0;

    // Process each vendor
    for (const [vendor, adSpend] of Object.entries(vendorSpend)) {
      const vendorSpinner = ora(`Processing ${vendor}...`).start();

      const vendorRows = findVendorInCbo(cboSheet, vendor);

      if (vendorRows.length > 0) {
        // Vendor exists, update ad spend
        const updated = updateVendorAdSpend(cboSheet, vendorRows, adSpend);
        totalUpdated += updated;
        vendorSpinner.succeed(`${vendor}: Updated (${vendorRows.length} rows)`);
      } else {
        // Vendor doesn't exist, insert new row
        const lastRow = cboSheet.rowCount;
        insertVendorRow(cboSheet, vendor, adSpend, lastRow);
        totalInserted++;
        vendorSpinner.warn(`${vendor}: Inserted new row (no sales)`);
      }
    }

    // Save CBO file
    const saveSpinner = ora('Saving CBO export...').start();
    await cboWorkbook.xlsx.writeFile(cboFile);
    saveSpinner.succeed('CBO export saved');

    console.log(chalk.green(`\n✓ Total: ${totalUpdated} updated, ${totalInserted} inserted`));

  } catch (error) {
    spinner.fail('Failed to process remaining vendors');
    console.error(chalk.red(error.message));
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const googleAdsFile = process.argv[2];
  const cboFile = process.argv[3];

  if (!googleAdsFile || !cboFile) {
    console.error(
      chalk.red('Usage: node handle-remaining-vendors.js <google-ads-file> <cbo-file>')
    );
    process.exit(1);
  }

  handleRemainingVendors(googleAdsFile, cboFile)
    .then(() => {
      console.log(chalk.green('\n✓ Remaining vendors processed!'));
    })
    .catch((error) => {
      console.error(chalk.red('\n✗ Failed:'), error);
      process.exit(1);
    });
}

export { handleRemainingVendors, getTotalAdSpendByVendor };
