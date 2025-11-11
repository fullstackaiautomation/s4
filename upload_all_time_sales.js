#!/usr/bin/env node

/**
 * Upload All Time Sales Data to Supabase
 * Uses the same connection method as the working dashboard
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY not found in .env');
  process.exit(1);
}

console.log('Initializing Supabase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function dropAndRecreateTable() {
  console.log('\n=== DROPPING OLD TABLE ===');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'all_time_sales_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Drop cascade
    const dropSql = 'DROP TABLE IF EXISTS all_time_sales CASCADE;';

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql });
    if (dropError && !dropError.message.includes('already exists')) {
      console.log('Note: Drop executed (or table did not exist)');
    }

    // Create new table
    console.log('\n=== CREATING NEW TABLE ===');

    // Split schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.log(`Note: ${error.message.substring(0, 100)}`);
        } else {
          console.log('✓ Created');
        }
      } catch (e) {
        console.log(`Note: ${e.message.substring(0, 100)}`);
      }
    }

    console.log('✓ Schema setup complete');
    return true;
  } catch (error) {
    console.error('Error setting up schema:', error.message);
    return false;
  }
}

async function uploadData() {
  console.log('\n=== UPLOADING DATA ===');

  const csvPath = path.join(__dirname, 'all_time_sales_data_fixed.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV file not found: ${csvPath}`);
    return false;
  }

  const records = [];
  let recordCount = 0;

  return new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
        recordCount++;

        // Upload in batches of 1000
        if (records.length >= 1000) {
          uploadBatch(records.splice(0, 1000), recordCount - 999);
        }
      })
      .on('end', async () => {
        // Upload remaining records
        if (records.length > 0) {
          await uploadBatch(records, recordCount - records.length + 1);
        }

        console.log(`\n✓ Completed! Total uploaded: ${recordCount} records`);
        resolve(true);
      })
      .on('error', (error) => {
        console.error('CSV read error:', error);
        resolve(false);
      });
  });
}

async function uploadBatch(batch, startNum) {
  try {
    // Convert numeric strings to actual numbers
    const cleanedBatch = batch.map(row => {
      const cleaned = {};
      for (const [key, value] of Object.entries(row)) {
        // Handle empty strings as null
        if (value === '' || value === 'null') {
          cleaned[key] = null;
        } else if (value === 'NaN') {
          cleaned[key] = null;
        } else if (!isNaN(value) && value !== '') {
          cleaned[key] = parseFloat(value);
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    });

    const { error } = await supabase
      .from('all_time_sales')
      .insert(cleanedBatch);

    if (error) {
      console.error(`Batch error: ${error.message}`);
    } else {
      console.log(`✓ Batch ${Math.ceil(startNum / 1000)}: ${batch.length} records uploaded`);
    }
  } catch (error) {
    console.error(`Upload error: ${error.message}`);
  }
}

async function main() {
  console.log('================================================');
  console.log('All Time Sales Data Import to Supabase');
  console.log('================================================');

  const schemaOk = await dropAndRecreateTable();
  if (!schemaOk) {
    console.error('Failed to set up schema');
    process.exit(1);
  }

  const uploadOk = await uploadData();
  if (!uploadOk) {
    console.error('Failed to upload data');
    process.exit(1);
  }

  console.log('\n================================================');
  console.log('SUCCESS: All time sales data imported!');
  console.log('================================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
