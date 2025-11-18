/**
 * Test GA4 Connection
 *
 * Run: npx tsx scripts/test-ga4.ts
 */

import { createGA4Client } from '../src/lib/integrations/ga4-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGA4() {
  console.log('🔍 Testing Google Analytics 4 Connection...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`  GA4_PROPERTY_ID: ${process.env.GA4_PROPERTY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  GA4_CREDENTIALS_JSON: ${process.env.GA4_CREDENTIALS_JSON ? '✅ Set' : '❌ Missing'}`);
  console.log();

  if (!process.env.GA4_PROPERTY_ID) {
    console.error('❌ GA4_PROPERTY_ID not found in environment variables');
    console.log('\nAdd to .env.local:');
    console.log('GA4_PROPERTY_ID=your-property-id');
    process.exit(1);
  }

  if (!process.env.GA4_CREDENTIALS_JSON) {
    console.error('❌ GA4_CREDENTIALS_JSON not found in environment variables');
    console.log('\nAdd to .env.local:');
    console.log('GA4_CREDENTIALS_JSON=\'{"type":"service_account","project_id":"..."}\'');
    console.log('\nOr use the JSON file you downloaded from Google Cloud Console');
    process.exit(1);
  }

  // Create client
  console.log('🔌 Creating GA4 client...');
  const client = createGA4Client();

  if (!client) {
    console.error('❌ Failed to create GA4 client');
    process.exit(1);
  }

  console.log('✅ GA4 client created successfully\n');

  // Test connection
  console.log('🧪 Testing connection to GA4...');
  const connectionTest = await client.testConnection();

  if (!connectionTest.success) {
    console.error(`❌ Connection failed: ${connectionTest.error}`);
    console.log('\nPossible issues:');
    console.log('  1. Invalid service account credentials');
    console.log('  2. Service account does not have access to GA4 property');
    console.log('  3. Invalid property ID');
    console.log('\nTo fix:');
    console.log('  1. Go to Google Analytics → Admin → Property Access Management');
    console.log('  2. Add your service account email as a Viewer');
    console.log(`  3. Service account email should be in your credentials JSON`);
    process.exit(1);
  }

  console.log('✅ Successfully connected to GA4!\n');

  // Fetch sample data
  console.log('📊 Fetching sample traffic data (last 7 days)...');
  try {
    const traffic = await client.getDailyTraffic({
      startDate: '7daysAgo',
      endDate: 'today'
    });

    console.log(`✅ Retrieved ${traffic.length} days of traffic data\n`);

    if (traffic.length > 0) {
      console.log('📈 Sample data (most recent day):');
      const latest = traffic[traffic.length - 1];
      console.log(`  Date: ${latest.date}`);
      console.log(`  Sessions: ${latest.sessions.toLocaleString()}`);
      console.log(`  Users: ${latest.users.toLocaleString()}`);
      console.log(`  New Users: ${latest.new_users.toLocaleString()}`);
      console.log(`  Pageviews: ${latest.pageviews.toLocaleString()}`);
      console.log(`  Engagement Rate: ${(latest.engagement_rate * 100).toFixed(2)}%`);
      console.log(`  Bounce Rate: ${(latest.bounce_rate * 100).toFixed(2)}%`);
      console.log(`  Avg Session Duration: ${latest.average_session_duration.toFixed(0)}s`);
    }

    console.log('\n✅ GA4 integration is ready!');
    console.log('\n📝 Next steps:');
    console.log('  1. Go to Supabase SQL Editor');
    console.log('  2. Run: Document Storage/SQL/ga4_schema.sql');
    console.log('  3. Start dev server: npm run dev');
    console.log('  4. Trigger sync:');
    console.log('     Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/sync/ga4" -Body \'{"fullSync":true}\' -ContentType "application/json"');

  } catch (error: any) {
    console.error(`❌ Error fetching data: ${error.message}`);
    console.log('\nThis might be normal if:');
    console.log('  - Your property has no data yet');
    console.log('  - Your date range is outside available data');
    console.log('\nBut connection was successful, so integration should work!');
  }
}

testGA4().catch(console.error);
