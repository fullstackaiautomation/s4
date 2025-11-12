/**
 * Process All - Main Orchestration Script
 * Runs all steps of the ads report processing workflow
 */

import { cleanData } from './clean-data.js';
import { findMissingSkus, findNAErrorsInFile } from './find-missing-skus.js';
import { mergeCboData } from './merge-cbo-data.js';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => readline.question(query, resolve));
}

/**
 * Display workflow menu
 */
function displayMenu() {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║   Ads Report Processing Automation            ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════╝\n'));

  console.log(chalk.white('Select operation:\n'));
  console.log(chalk.yellow('1)') + ' Clean Data - Add month, platform, product category');
  console.log(chalk.yellow('2)') + ' Find Missing SKUs - Add VLOOKUP formulas');
  console.log(chalk.yellow('3)') + ' Check #N/A Errors - After Excel calculates formulas');
  console.log(chalk.yellow('4)') + ' Merge CBO Data - Add ad spend to CBO export');
  console.log(chalk.yellow('5)') + ' Run Full Workflow - All steps in sequence');
  console.log(chalk.yellow('6)') + ' Exit\n');
}

/**
 * Run step 1: Clean data
 */
async function runCleanData(googleAdsFile) {
  console.log(chalk.blue('\n═══ Step 1: Clean Data ═══\n'));

  await cleanData(googleAdsFile);

  console.log(chalk.green('✓ Data cleaning completed'));
  console.log(chalk.gray('  - Added month data (columns K-L)'));
  console.log(chalk.gray('  - Added platform data (column M)'));
  console.log(chalk.gray('  - Extended product category formulas (column N)'));
}

/**
 * Run step 2: Find missing SKUs
 */
async function runFindMissingSkus(googleAdsFile) {
  console.log(chalk.blue('\n═══ Step 2: Find Missing SKUs ═══\n'));

  const results = await findMissingSkus(googleAdsFile);

  if (results.blankSkus.length > 0) {
    console.log(chalk.yellow('\n⚠ Action Required:'));
    console.log(chalk.white('  1. Open the Excel file'));
    console.log(chalk.white('  2. Let formulas calculate'));
    console.log(chalk.white('  3. Save and close'));
    console.log(chalk.white('  4. Run Step 3 to check for #N/A errors'));
  }
}

/**
 * Run step 3: Check #N/A errors
 */
async function runCheckNAErrors(googleAdsFile) {
  console.log(chalk.blue('\n═══ Step 3: Check #N/A Errors ═══\n'));

  const { naErrors, missingCategories, allMissingTitles } = await findNAErrorsInFile(googleAdsFile);

  if (naErrors.length > 0 || missingCategories.length > 0) {
    console.log(chalk.yellow('\n⚠ Action Required:'));
    console.log(chalk.white('  1. Copy the titles listed above'));
    console.log(chalk.white('  2. Paste them into the ALL SKUS tab'));
    console.log(chalk.white('  3. Look up missing SKUs on source4industries.com'));
    console.log(chalk.white('  4. Fill in the SKU and Vendor columns'));
    console.log(chalk.white('  5. Save the file'));
    console.log(chalk.white('  6. Re-run this step to verify'));

    return false; // Not ready to proceed
  }

  console.log(chalk.green('✓ All SKUs and categories found!'));
  return true; // Ready to proceed
}

/**
 * Run step 4: Merge CBO data
 */
async function runMergeCbo(googleAdsFile, cboFile) {
  console.log(chalk.blue('\n═══ Step 4: Merge CBO Data ═══\n'));

  await mergeCboData(googleAdsFile, cboFile);

  console.log(chalk.green('✓ CBO merge completed'));
  console.log(chalk.gray('  - Updated ad spend for existing categories'));
  console.log(chalk.gray('  - Inserted rows for categories with ads but no sales'));
  console.log(chalk.gray('  - Validated totals match'));
}

/**
 * Run full workflow
 */
async function runFullWorkflow(googleAdsFile, cboFile) {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║   Running Full Workflow                       ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════╝\n'));

  try {
    // Step 1: Clean data
    await runCleanData(googleAdsFile);

    // Step 2: Find missing SKUs
    await runFindMissingSkus(googleAdsFile);

    // Pause for manual intervention
    console.log(chalk.yellow('\n⏸ Workflow Paused'));
    const proceed = await question(
      chalk.white('Have you opened Excel, let formulas calculate, and saved? (y/n): ')
    );

    if (proceed.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Workflow stopped. Run again when ready.'));
      return;
    }

    // Step 3: Check #N/A errors
    const allClear = await runCheckNAErrors(googleAdsFile);

    if (!allClear) {
      console.log(chalk.yellow('\n⏸ Workflow Paused - Manual intervention required'));
      console.log(chalk.white('Complete the missing SKU lookups and run the workflow again.'));
      return;
    }

    // Step 4: Merge CBO data
    await runMergeCbo(googleAdsFile, cboFile);

    console.log(chalk.green('\n\n✓✓✓ Full workflow completed successfully! ✓✓✓\n'));

  } catch (error) {
    console.error(chalk.red('\n✗ Workflow failed:'), error.message);
    throw error;
  }
}

/**
 * Main menu loop
 */
async function main() {
  // Get file paths
  const googleAdsFile = process.argv[2];
  const cboFile = process.argv[3];

  if (!googleAdsFile) {
    console.error(
      chalk.red('Usage: node process-all.js <google-ads-file> [cbo-file]')
    );
    process.exit(1);
  }

  let running = true;

  while (running) {
    displayMenu();

    const choice = await question(chalk.cyan('Enter choice (1-6): '));

    try {
      switch (choice.trim()) {
        case '1':
          await runCleanData(googleAdsFile);
          break;

        case '2':
          await runFindMissingSkus(googleAdsFile);
          break;

        case '3':
          await runCheckNAErrors(googleAdsFile);
          break;

        case '4':
          if (!cboFile) {
            console.error(chalk.red('CBO file path required for this operation'));
            break;
          }
          await runMergeCbo(googleAdsFile, cboFile);
          break;

        case '5':
          if (!cboFile) {
            console.error(chalk.red('CBO file path required for full workflow'));
            break;
          }
          await runFullWorkflow(googleAdsFile, cboFile);
          break;

        case '6':
          running = false;
          console.log(chalk.cyan('\nGoodbye!\n'));
          break;

        default:
          console.log(chalk.red('Invalid choice. Please enter 1-6.'));
      }

      if (running && choice !== '5') {
        await question(chalk.gray('\nPress Enter to continue...'));
      }

    } catch (error) {
      console.error(chalk.red('\nError:'), error.message);
      await question(chalk.gray('\nPress Enter to continue...'));
    }
  }

  readline.close();
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red('\nFatal error:'), error);
    process.exit(1);
  });
}

export { runFullWorkflow, runCleanData, runFindMissingSkus, runCheckNAErrors, runMergeCbo };
