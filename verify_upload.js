#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log('Verifying data in Supabase...\n');

  try {
    // Count total records
    const { count, error: countError } = await supabase
      .from('all_time_sales')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error querying table:', countError);
      return;
    }

    console.log(`Total records in all_time_sales: ${count}`);

    // Get sample records
    const { data, error } = await supabase
      .from('all_time_sales')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching records:', error);
      return;
    }

    console.log(`\nSample records (first 5):`);
    console.log(JSON.stringify(data, null, 2));

    // Check views exist
    console.log('\nChecking views...');
    const viewQueries = [
      'monthly_sales_summary',
      'vendor_sales_performance',
      'category_sales_performance',
      'sales_by_channel'
    ];

    for (const view of viewQueries) {
      const { data: viewData, error: viewError } = await supabase
        .from(view)
        .select('*')
        .limit(1);

      if (viewError) {
        console.log(`✗ ${view}: ${viewError.message}`);
      } else {
        console.log(`✓ ${view}: Available`);
      }
    }

  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

verify();
