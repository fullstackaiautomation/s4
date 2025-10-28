/**
 * Find Missing SKUs and Vendor Script
 * Handles VLOOKUP operations and identifies missing data
 */

import ExcelJS from 'exceljs';
import { COLUMNS, FILE_PATHS } from './config.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Find rows with blank or missing SKU values
 */
function findBlankSkus(worksheet, startRow = 2) {
  const blanks = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    const skuCell = row.getCell(COLUMNS.SKU + 1);
    const value = skuCell.value?.toString().trim();

    if (!value || value === '' || value === '-' || value === '--') {
      blanks.push({
        row: rowNumber,
        title: row.getCell(COLUMNS.TITLE + 1).value,
        currentSku: value
      });
    }
  });

  return blanks;
}

/**
 * Add VLOOKUP formulas for SKU and Vendor
 */
function addVlookupFormulas(worksheet, blankRows) {
  let added = 0;

  blankRows.forEach(({ row: rowNumber }) => {
    const row = worksheet.getRow(rowNumber);
    const titleCell = row.getCell(COLUMNS.TITLE + 1);
    const titleAddress = titleCell.address; // e.g., "C123"

    // Column A: SKU VLOOKUP
    const skuCell = row.getCell(COLUMNS.SKU + 1);
    skuCell.value = {
      formula: `VLOOKUP(${titleAddress},'ALL SKUS'!A:C,2,FALSE)`,
      result: ''
    };

    // Column B: Vendor VLOOKUP
    const vendorCell = row.getCell(COLUMNS.VENDOR + 1);
    vendorCell.value = {
      formula: `VLOOKUP(${titleAddress},'ALL SKUS'!A:C,3,FALSE)`,
      result: ''
    };

    added++;
  });

  return added;
}

/**
 * Find cells with #N/A errors (formula not found in lookup)
 */
function findNAErrors(worksheet, startRow = 2) {
  const naErrors = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    const skuCell = row.getCell(COLUMNS.SKU + 1);
    const vendorCell = row.getCell(COLUMNS.VENDOR + 1);

    // Check for error values
    if (skuCell.value?.error === '#N/A' || vendorCell.value?.error === '#N/A') {
      naErrors.push({
        row: rowNumber,
        title: row.getCell(COLUMNS.TITLE + 1).value,
        sku: skuCell.value,
        vendor: vendorCell.value
      });
    }
  });

  return naErrors;
}

/**
 * Extract titles for missing SKUs to add to ALL SKUS sheet
 */
function extractMissingTitles(naErrors) {
  return naErrors.map(error => error.title).filter(Boolean);
}

/**
 * Add missing titles to ALL SKUS sheet
 */
async function addToAllSkusSheet(workbook, titles) {
  const allSkusSheet = workbook.getWorksheet(FILE_PATHS.ALL_SKUS_SHEET);

  if (!allSkusSheet) {
    throw new Error(`Sheet "${FILE_PATHS.ALL_SKUS_SHEET}" not found in workbook`);
  }

  let lastRow = allSkusSheet.rowCount;
  let added = 0;

  titles.forEach(title => {
    lastRow++;
    const row = allSkusSheet.getRow(lastRow);
    row.getCell(1).value = title; // Column A: Title
    // Columns B and C (SKU and Vendor) to be filled manually
    added++;
  });

  return added;
}

/**
 * Check for missing product categories (#N/A in vendor tabs)
 */
function findMissingProductCategories(worksheet, startRow = 2) {
  const missing = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    const categoryCell = row.getCell(COLUMNS.PRODUCT_CATEGORY + 1);

    if (categoryCell.value?.error === '#N/A') {
      missing.push({
        row: rowNumber,
        vendor: row.getCell(COLUMNS.VENDOR + 1).value,
        title: row.getCell(COLUMNS.TITLE + 1).value
      });
    }
  });

  return missing;
}

/**
 * Main execution function
 */
async function findMissingSkus(filePath, options = {}) {
  const spinner = ora('Loading workbook...').start();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    spinner.succeed('Workbook loaded');

    const results = {
      blankSkus: [],
      naErrors: [],
      missingCategories: [],
      titlesAdded: 0
    };

    // Process each worksheet
    for (const worksheet of workbook.worksheets) {
      if (worksheet.name.startsWith('_') || worksheet.name === 'ALL SKUS') {
        continue;
      }

      const sheetSpinner = ora(`Checking ${worksheet.name}...`).start();

      // Step 1: Find blank SKUs
      const blanks = findBlankSkus(worksheet);
      if (blanks.length > 0) {
        results.blankSkus.push({
          sheet: worksheet.name,
          count: blanks.length,
          rows: blanks
        });

        // Add VLOOKUP formulas
        const added = addVlookupFormulas(worksheet, blanks);
        sheetSpinner.info(
          `${worksheet.name}: Found ${blanks.length} blank SKUs, added ${added} VLOOKUP formulas`
        );
      }

      // Step 2: Find #N/A errors (after formulas are added, need to recalculate)
      // Note: ExcelJS doesn't calculate formulas, so this needs to be done after opening in Excel
      sheetSpinner.succeed(`${worksheet.name}: Checked`);
    }

    // Save workbook with added formulas
    if (results.blankSkus.length > 0) {
      const saveSpinner = ora('Saving workbook with VLOOKUP formulas...').start();
      await workbook.xlsx.writeFile(filePath);
      saveSpinner.succeed('Workbook saved');

      console.log(chalk.yellow(
        '\n⚠ Please open the Excel file, let formulas calculate, and run this script again to find #N/A errors'
      ));
    }

    // Display results
    console.log(chalk.blue('\n=== Missing SKU Report ==='));
    if (results.blankSkus.length === 0) {
      console.log(chalk.green('✓ No blank SKUs found'));
    } else {
      results.blankSkus.forEach(({ sheet, count, rows }) => {
        console.log(chalk.yellow(`\n${sheet}: ${count} blank SKUs`));
        rows.slice(0, 5).forEach(({ row, title }) => {
          console.log(chalk.gray(`  Row ${row}: ${title}`));
        });
        if (count > 5) {
          console.log(chalk.gray(`  ... and ${count - 5} more`));
        }
      });
    }

    return results;

  } catch (error) {
    spinner.fail('Error finding missing SKUs');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Second pass: After Excel calculates formulas, find #N/A errors
 */
async function findNAErrorsInFile(filePath) {
  const spinner = ora('Loading workbook to check for #N/A errors...').start();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    spinner.succeed('Workbook loaded');

    const naErrors = [];
    const missingCategories = [];
    const allMissingTitles = [];

    for (const worksheet of workbook.worksheets) {
      if (worksheet.name.startsWith('_') || worksheet.name === 'ALL SKUS') {
        continue;
      }

      const errors = findNAErrors(worksheet);
      if (errors.length > 0) {
        naErrors.push({
          sheet: worksheet.name,
          errors
        });
        allMissingTitles.push(...extractMissingTitles(errors));
      }

      const catErrors = findMissingProductCategories(worksheet);
      if (catErrors.length > 0) {
        missingCategories.push({
          sheet: worksheet.name,
          missing: catErrors
        });
      }
    }

    // Display results
    if (naErrors.length > 0) {
      console.log(chalk.red('\n=== #N/A Errors Found ==='));
      naErrors.forEach(({ sheet, errors }) => {
        console.log(chalk.yellow(`\n${sheet}: ${errors.length} errors`));
        errors.forEach(({ row, title }) => {
          console.log(chalk.gray(`  Row ${row}: ${title}`));
        });
      });

      console.log(chalk.blue(`\n\nTitles to add to ALL SKUS sheet (${allMissingTitles.length}):`));
      allMissingTitles.forEach((title, i) => {
        console.log(chalk.gray(`${i + 1}. ${title}`));
      });
    }

    if (missingCategories.length > 0) {
      console.log(chalk.red('\n=== Missing Product Categories ==='));
      missingCategories.forEach(({ sheet, missing }) => {
        console.log(chalk.yellow(`${sheet}: ${missing.length} missing categories`));
      });
    }

    return { naErrors, missingCategories, allMissingTitles };

  } catch (error) {
    spinner.fail('Error checking for #N/A errors');
    console.error(chalk.red(error.message));
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  const mode = process.argv[3] || 'vlookup'; // 'vlookup' or 'check'

  if (!filePath) {
    console.error(chalk.red('Usage: node find-missing-skus.js <excel-file-path> [vlookup|check]'));
    process.exit(1);
  }

  const operation = mode === 'check' ? findNAErrorsInFile : findMissingSkus;

  operation(filePath)
    .then(() => {
      console.log(chalk.green('\n✓ Operation completed!'));
    })
    .catch((error) => {
      console.error(chalk.red('\n✗ Operation failed:'), error);
      process.exit(1);
    });
}

export { findMissingSkus, findNAErrorsInFile };
