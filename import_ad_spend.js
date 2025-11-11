/**
 * Upload Ad Spend Data to Supabase
 *
 * This script reads the prepared CSV file and uploads it to Supabase.
 * It uses the Supabase JavaScript client which is compatible with Node.js.
 *
 * Usage:
 *   node import_ad_spend.js
 *   node import_ad_spend.js --test          (imports only first 100 rows)
 *   node import_ad_spend.js --batch-size 500 (custom batch size)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parse/sync');
require('dotenv').config();

// Configuration
const args = process.argv.slice(2);
const testMode = args.includes('--test');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size'));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 1000;

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  console.error('[INFO] Ensure your .env file contains:');
  console.error('       SUPABASE_URL=...');
  console.error('       SUPABASE_KEY=...');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function readCSV(filePath) {
  try {
    console.log(`[INFO] Reading CSV file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"'
    });

    // Convert string values to proper types
    const converted = records.map(row => ({
      month: row.month || null,
      platform: row.platform || null,
      sku: row.sku || null,
      title: row.title || null,
      vendor: row.vendor || null,
      product_category: row.product_category || null,
      ad_spend: row.ad_spend ? parseFloat(row.ad_spend) : null,
      impressions: row.impressions ? parseInt(row.impressions) : null,
      clicks: row.clicks ? parseInt(row.clicks) : null,
      ctr: row.ctr ? parseFloat(row.ctr) : null,
      avg_cpc: row.avg_cpc ? parseFloat(row.avg_cpc) : null,
      conversions: row.conversions ? parseFloat(row.conversions) : null,
      revenue: row.revenue ? parseFloat(row.revenue) : null,
      price: row.price ? parseFloat(row.price) : null,
      impression_share: row.impression_share ? parseFloat(row.impression_share) : null,
      impression_share_lost_to_rank: row.impression_share_lost_to_rank ? parseFloat(row.impression_share_lost_to_rank) : null,
      absolute_top_impression_share: row.absolute_top_impression_share ? parseFloat(row.absolute_top_impression_share) : null,
      campaign: row.campaign || null,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    }));

    console.log(`[SUCCESS] Read ${records.length} rows from CSV`);
    return converted;
  } catch (error) {
    console.error(`[ERROR] Failed to read CSV: ${error.message}`);
    process.exit(1);
  }
}

async function importToSupabase(records) {
  if (testMode) {
    console.log(`[INFO] TEST MODE: Using only first 100 records`);
    records = records.slice(0, 100);
  }

  console.log(`[INFO] Starting import to Supabase (${records.length} records)...`);

  let imported = 0;
  let failed = 0;
  const totalBatches = Math.ceil(records.length / batchSize);

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    try {
      console.log(`[INFO] Importing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

      const { data, error } = await supabase
        .from('sku_ad_spend')
        .insert(batch);

      if (error) {
        console.error(`[ERROR] Batch ${batchNum} failed: ${error.message}`);
        failed += batch.length;
      } else {
        imported += batch.length;
        console.log(`[SUCCESS] Batch ${batchNum} imported successfully`);
      }
    } catch (error) {
      console.error(`[ERROR] Batch ${batchNum} error: ${error.message}`);
      failed += batch.length;
    }

    // Progress update
    const progress = ((imported + failed) / records.length * 100).toFixed(1);
    console.log(`[PROGRESS] ${imported + failed}/${records.length} rows (${progress}%)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('[SUMMARY] Import Complete!');
  console.log(`  Total rows: ${records.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(60));

  return failed === 0;
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('AD SPEND DATA IMPORT TO SUPABASE');
    console.log('='.repeat(60));
    console.log();

    // Read CSV
    const csvPath = path.join(__dirname, 'sku_ad_spend_upload.csv');
    const records = await readCSV(csvPath);

    // Import to Supabase
    const success = await importToSupabase(records);

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`[ERROR] Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
