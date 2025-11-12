/**
 * Clear existing data and reimport fresh
 *
 * Usage:
 *   node clear_and_reimport.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parse/sync');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function clearTable() {
  try {
    console.log(`[INFO] Clearing existing data from sku_ad_spend table...`);

    // First, get count of existing records
    const { count, error: countError } = await supabase
      .from('sku_ad_spend')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`[ERROR] Failed to count records: ${countError.message}`);
      return false;
    }

    console.log(`[INFO] Found ${count} existing records`);

    // Delete all records
    const { error } = await supabase
      .from('sku_ad_spend')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This matches all records

    if (error) {
      console.error(`[ERROR] Failed to delete records: ${error.message}`);
      return false;
    }

    console.log(`[SUCCESS] Cleared all existing records`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Unexpected error during clear: ${error.message}`);
    return false;
  }
}

async function importToSupabase(records) {
  console.log(`[INFO] Starting fresh import to Supabase (${records.length} records)...`);

  let imported = 0;
  let failed = 0;
  const batchSize = 1000;
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
    console.log(`[PROGRESS] ${imported + failed}/${records.length} rows (${progress}%)\n`);
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
    console.log('CLEAR AND REIMPORT AD SPEND DATA');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Clear existing data
    console.log('[STEP 1] CLEARING EXISTING DATA');
    console.log('-'.repeat(60));
    const cleared = await clearTable();
    if (!cleared) {
      console.error('[ERROR] Failed to clear table. Aborting.');
      process.exit(1);
    }
    console.log();

    // Step 2: Read CSV
    console.log('[STEP 2] READING CSV FILE');
    console.log('-'.repeat(60));
    const csvPath = path.join(__dirname, 'sku_ad_spend_upload.csv');
    const records = await readCSV(csvPath);
    console.log();

    // Step 3: Import to Supabase
    console.log('[STEP 3] IMPORTING DATA');
    console.log('-'.repeat(60));
    const success = await importToSupabase(records);

    if (success) {
      console.log('\n[SUCCESS] All data imported successfully!');
      process.exit(0);
    } else {
      console.log('\n[ERROR] Some batches failed during import');
      process.exit(1);
    }
  } catch (error) {
    console.error(`[ERROR] Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
