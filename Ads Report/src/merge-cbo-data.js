/**
 * Merge CBO Data Script
 * Adds ad spend data to CBOS TO DASH MONTHLY EXPORT spreadsheet
 */

import ExcelJS from 'exceljs';
import { MAIN_VENDORS, CASTER_VENDORS, ROW_COLORS } from './config.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Get total ad spend by vendor and product category from Google Ads file
 */
async function getAdSpendByVendor(googleAdsFilePath, month) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(googleAdsFilePath);

  const adSpendData = {};

  for (const vendor of MAIN_VENDORS) {
    // Handle caster vendors specially
    let vendorNames = [vendor];
    if (vendor === 'CASTERS') {
      vendorNames = CASTER_VENDORS;
    }

    for (const vendorName of vendorNames) {
      // Try to find vendor sheet
      const vendorSheet = workbook.worksheets.find(
        ws => ws.name.toUpperCase().includes(vendorName.toUpperCase())
      );

      if (!vendorSheet) {
        console.warn(chalk.yellow(`Warning: Sheet for vendor "${vendorName}" not found`));
        continue;
      }

      // Group ad spend by product category
      const categorySpend = {};

      vendorSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 2) return; // Skip header

        const category = row.getCell(14).value; // Column N
        const adSpend = parseFloat(row.getCell(8).value) || 0; // Column H

        if (category && adSpend > 0) {
          if (!categorySpend[category]) {
            categorySpend[category] = 0;
          }
          categorySpend[category] += adSpend;
        }
      });

      // Store in results
      if (!adSpendData[vendor]) {
        adSpendData[vendor] = {};
      }

      Object.entries(categorySpend).forEach(([category, spend]) => {
        if (!adSpendData[vendor][category]) {
          adSpendData[vendor][category] = 0;
        }
        adSpendData[vendor][category] += spend;
      });
    }
  }

  return adSpendData;
}

/**
 * Find rows in CBO export for a specific vendor
 */
function findVendorRows(worksheet, vendor) {
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 2) return;

    const rowVendor = row.getCell(2).value?.toString().toUpperCase(); // Column B
    if (rowVendor && rowVendor.includes(vendor.toUpperCase())) {
      rows.push({
        rowNumber,
        vendor: row.getCell(2).value,
        category: row.getCell(14).value, // Column N
        currentAdSpend: parseFloat(row.getCell(8).value) || 0 // Column H
      });
    }
  });

  return rows;
}

/**
 * Update ad spend for matching rows
 */
function updateAdSpend(worksheet, vendorRows, categorySpend) {
  let updated = 0;

  vendorRows.forEach(({ rowNumber, category }) => {
    if (!category || !categorySpend[category]) return;

    const row = worksheet.getRow(rowNumber);
    const adSpendCell = row.getCell(8); // Column H
    adSpendCell.value = categorySpend[category];

    // Mark as updated
    updated++;
  });

  return updated;
}

/**
 * Insert new row for ad spend without corresponding sales
 */
function insertAdSpendRow(worksheet, insertAfterRow, vendor, category, adSpend, sampleRow) {
  const newRow = worksheet.insertRow(insertAfterRow + 1);

  // Copy values from sample row (D & E)
  newRow.getCell(4).value = sampleRow.getCell(4).value; // Column D
  newRow.getCell(5).value = sampleRow.getCell(5).value; // Column E

  // Set vendor
  newRow.getCell(2).value = vendor; // Column B

  // Get a sample SKU from the vendor's product spend
  // (This would require lookup - simplified for now)
  // newRow.getCell(7).value = sampleSku; // Column G

  // Set ad spend
  newRow.getCell(8).value = adSpend; // Column H

  // Set product category
  newRow.getCell(14).value = category; // Column N

  // Copy values W-Z from above
  newRow.getCell(23).value = sampleRow.getCell(23).value; // Column W
  newRow.getCell(24).value = sampleRow.getCell(24).value; // Column X
  newRow.getCell(25).value = sampleRow.getCell(25).value; // Column Y
  newRow.getCell(26).value = sampleRow.getCell(26).value; // Column Z

  // Color the row light yellow
  newRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ROW_COLORS.LIGHT_YELLOW }
    };
  });

  return newRow;
}

/**
 * Merge ad spend data into CBO export
 */
async function mergeAdSpendData(cboFilePath, adSpendData) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(cboFilePath);

  const worksheet = workbook.getWorksheet(1); // Assuming first sheet

  let totalUpdated = 0;
  let totalInserted = 0;

  for (const [vendor, categorySpend] of Object.entries(adSpendData)) {
    const spinner = ora(`Processing ${vendor}...`).start();

    // Find all rows for this vendor
    const vendorRows = findVendorRows(worksheet, vendor);

    if (vendorRows.length === 0) {
      spinner.warn(`No existing rows found for ${vendor}`);
      continue;
    }

    // Update matching rows
    const updated = updateAdSpend(worksheet, vendorRows, categorySpend);
    totalUpdated += updated;

    // Find categories with ad spend but no sales
    const existingCategories = new Set(vendorRows.map(r => r.category));
    const missingCategories = Object.keys(categorySpend).filter(
      cat => !existingCategories.has(cat)
    );

    // Insert new rows for missing categories
    if (missingCategories.length > 0) {
      const lastVendorRow = vendorRows[vendorRows.length - 1];
      const sampleRow = worksheet.getRow(lastVendorRow.rowNumber);

      let insertAfter = lastVendorRow.rowNumber;

      for (const category of missingCategories) {
        insertAdSpendRow(
          worksheet,
          insertAfter,
          vendor,
          category,
          categorySpend[category],
          sampleRow
        );
        insertAfter++;
        totalInserted++;
      }
    }

    spinner.succeed(`${vendor}: ${updated} updated, ${missingCategories.length} inserted`);
  }

  // Save workbook
  const saveSpinner = ora('Saving CBO export...').start();
  await workbook.xlsx.writeFile(cboFilePath);
  saveSpinner.succeed('CBO export saved');

  console.log(chalk.green(`\n✓ Total: ${totalUpdated} rows updated, ${totalInserted} rows inserted`));
}

/**
 * Validate total ad spend matches between files
 */
async function validateAdSpend(cboFilePath, adSpendData) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(cboFilePath);
  const worksheet = workbook.getWorksheet(1);

  const mismatches = [];

  for (const [vendor, categorySpend] of Object.entries(adSpendData)) {
    const vendorRows = findVendorRows(worksheet, vendor);

    // Calculate total from CBO file
    const cboTotal = vendorRows.reduce((sum, { currentAdSpend }) => sum + currentAdSpend, 0);

    // Calculate total from ad spend data
    const adsTotal = Object.values(categorySpend).reduce((sum, val) => sum + val, 0);

    if (Math.abs(cboTotal - adsTotal) > 0.01) {
      mismatches.push({
        vendor,
        cboTotal: cboTotal.toFixed(2),
        adsTotal: adsTotal.toFixed(2),
        difference: (cboTotal - adsTotal).toFixed(2)
      });
    }
  }

  if (mismatches.length > 0) {
    console.log(chalk.red('\n⚠ Ad spend mismatches detected:'));
    mismatches.forEach(({ vendor, cboTotal, adsTotal, difference }) => {
      console.log(
        chalk.yellow(`  ${vendor}: CBO=$${cboTotal}, Ads=$${adsTotal}, Diff=$${difference}`)
      );
    });
  } else {
    console.log(chalk.green('\n✓ All ad spend totals match!'));
  }

  return mismatches;
}

/**
 * Main execution function
 */
async function mergeCboData(googleAdsFile, cboFile, options = {}) {
  const spinner = ora('Starting CBO merge process...').start();

  try {
    spinner.text = 'Calculating ad spend from Google Ads file...';
    const adSpendData = await getAdSpendByVendor(googleAdsFile, options.month);
    spinner.succeed(`Ad spend calculated for ${Object.keys(adSpendData).length} vendors`);

    // Display summary
    console.log(chalk.blue('\n=== Ad Spend Summary ==='));
    Object.entries(adSpendData).forEach(([vendor, categories]) => {
      const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
      console.log(chalk.gray(`${vendor}: $${total.toFixed(2)} across ${Object.keys(categories).length} categories`));
    });

    // Merge data
    await mergeAdSpendData(cboFile, adSpendData);

    // Validate
    if (options.validate !== false) {
      await validateAdSpend(cboFile, adSpendData);
    }

    console.log(chalk.green('\n✓ CBO merge completed successfully!'));

  } catch (error) {
    spinner.fail('CBO merge failed');
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
      chalk.red('Usage: node merge-cbo-data.js <google-ads-file> <cbo-export-file>')
    );
    process.exit(1);
  }

  mergeCboData(googleAdsFile, cboFile)
    .catch((error) => {
      console.error(chalk.red('\n✗ Merge failed:'), error);
      process.exit(1);
    });
}

export { mergeCboData, getAdSpendByVendor, validateAdSpend };
