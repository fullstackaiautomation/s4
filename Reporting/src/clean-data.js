/**
 * Data Cleaning Script
 * Handles columns K-N: Letter & Month data, Platform, Product Category
 */

import ExcelJS from 'exceljs';
import { MONTH_MAPPINGS, PLATFORMS, COLUMNS } from './config.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Determine platform based on sheet name or data
 */
function determinePlatform(sheetName, rowData) {
  const nameLower = sheetName.toLowerCase();
  if (nameLower.includes('google')) return PLATFORMS.GOOGLE;
  if (nameLower.includes('bing')) return PLATFORMS.BING;

  // Fallback: check row data if available
  // You can add more logic here based on your data structure
  return PLATFORMS.GOOGLE; // Default
}

/**
 * Get month mapping based on report date or current date
 */
function getMonthMapping(reportDate = new Date()) {
  const monthYear = reportDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return MONTH_MAPPINGS[monthYear] || null;
}

/**
 * Add letter and month data to columns K-L
 */
async function addMonthData(worksheet, monthMapping, startRow = 2) {
  let processedRows = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return; // Skip header

    const letterCell = row.getCell(COLUMNS.LETTER + 1); // ExcelJS is 1-based
    const monthCell = row.getCell(COLUMNS.MONTH + 1);

    if (!letterCell.value) {
      letterCell.value = monthMapping.letter;
    }
    if (!monthCell.value) {
      monthCell.value = monthMapping.short;
    }

    processedRows++;
  });

  return processedRows;
}

/**
 * Add platform data to column M
 */
async function addPlatformData(worksheet, platform, startRow = 2) {
  let processedRows = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    const platformCell = row.getCell(COLUMNS.PLATFORM + 1);
    if (!platformCell.value) {
      platformCell.value = platform;
      processedRows++;
    }
  });

  return processedRows;
}

/**
 * Drag formula down for product category (column N)
 */
async function dragProductCategoryFormula(worksheet, startRow = 2) {
  let processedRows = 0;
  const categoryColumn = COLUMNS.PRODUCT_CATEGORY + 1;

  // Find the first row with a formula in column N
  let sourceFormula = null;
  let sourceRow = null;

  for (let i = 1; i < startRow + 10; i++) {
    const cell = worksheet.getCell(i, categoryColumn);
    if (cell.formula) {
      sourceFormula = cell.formula;
      sourceRow = i;
      break;
    }
  }

  if (!sourceFormula) {
    console.warn(chalk.yellow(`No formula found in column N to drag down`));
    return 0;
  }

  // Apply formula to all rows below
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= sourceRow) return;

    const cell = row.getCell(categoryColumn);
    if (!cell.formula && !cell.value) {
      // Adjust formula for current row
      const adjustedFormula = adjustFormulaForRow(sourceFormula, sourceRow, rowNumber);
      cell.formula = adjustedFormula;
      processedRows++;
    }
  });

  return processedRows;
}

/**
 * Adjust Excel formula for a different row
 */
function adjustFormulaForRow(formula, sourceRow, targetRow) {
  const rowDiff = targetRow - sourceRow;

  // Simple row adjustment - replace row numbers in formula
  return formula.replace(/(\$?[A-Z]+)(\$?\d+)/g, (match, col, row) => {
    if (row.startsWith('$')) {
      return match; // Absolute reference, don't change
    }
    const newRow = parseInt(row) + rowDiff;
    return `${col}${newRow}`;
  });
}

/**
 * Main execution function
 */
async function cleanData(filePath, options = {}) {
  const spinner = ora('Loading workbook...').start();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    spinner.succeed('Workbook loaded');

    const monthMapping = options.monthMapping || getMonthMapping();
    if (!monthMapping) {
      throw new Error('Could not determine month mapping');
    }

    console.log(chalk.blue(`Using month mapping: ${monthMapping.letter} - ${monthMapping.short}`));

    let totalProcessed = 0;

    // Process each worksheet
    for (const worksheet of workbook.worksheets) {
      if (worksheet.name.startsWith('_') || worksheet.name === 'ALL SKUS') {
        continue; // Skip hidden or reference sheets
      }

      const sheetSpinner = ora(`Processing ${worksheet.name}...`).start();

      try {
        const platform = determinePlatform(worksheet.name, null);

        // Step 1: Add month data
        const monthRows = await addMonthData(worksheet, monthMapping);

        // Step 2: Add platform data
        const platformRows = await addPlatformData(worksheet, platform);

        // Step 3: Drag product category formula
        const categoryRows = await dragProductCategoryFormula(worksheet);

        totalProcessed += monthRows;

        sheetSpinner.succeed(
          `${worksheet.name}: ${monthRows} rows updated (Platform: ${platform})`
        );
      } catch (err) {
        sheetSpinner.fail(`Error processing ${worksheet.name}: ${err.message}`);
      }
    }

    // Save the workbook
    const saveSpinner = ora('Saving workbook...').start();
    await workbook.xlsx.writeFile(filePath);
    saveSpinner.succeed('Workbook saved successfully');

    console.log(chalk.green(`\n✓ Total rows processed: ${totalProcessed}`));

  } catch (error) {
    spinner.fail('Error during data cleaning');
    console.error(chalk.red(error.message));
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(chalk.red('Usage: node clean-data.js <excel-file-path>'));
    process.exit(1);
  }

  cleanData(filePath)
    .then(() => {
      console.log(chalk.green('\n✓ Data cleaning completed successfully!'));
    })
    .catch((error) => {
      console.error(chalk.red('\n✗ Data cleaning failed:'), error);
      process.exit(1);
    });
}

export { cleanData };
