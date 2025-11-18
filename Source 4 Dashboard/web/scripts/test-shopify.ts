/**
 * Test Shopify Connection
 *
 * Run: npx tsx scripts/test-shopify.ts
 */

import { createShopifyClient } from '../src/lib/integrations/shopify-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testShopify() {
  console.log('🔍 Testing Shopify Connection...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`  SHOPIFY_SHOP_DOMAIN: ${process.env.SHOPIFY_SHOP_DOMAIN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SHOPIFY_ACCESS_TOKEN: ${process.env.SHOPIFY_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log();

  if (!process.env.SHOPIFY_SHOP_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Missing Shopify credentials');
    process.exit(1);
  }

  // Create client
  console.log('🔌 Creating Shopify client...');
  const client = createShopifyClient();

  if (!client) {
    console.error('❌ Failed to create Shopify client');
    process.exit(1);
  }

  console.log('✅ Shopify client created successfully\n');

  // Test connection
  console.log('🧪 Testing connection to Shopify...');
  const connectionTest = await client.testConnection();

  if (!connectionTest.success) {
    console.error(`❌ Connection failed: ${connectionTest.error}`);
    process.exit(1);
  }

  console.log('✅ Successfully connected to Shopify!\n');

  // Display shop info
  console.log('🏪 Shop Info:');
  console.log(`  Name: ${connectionTest.shop.name}`);
  console.log(`  Domain: ${connectionTest.shop.domain}`);
  console.log(`  Email: ${connectionTest.shop.email}`);
  console.log(`  Currency: ${connectionTest.shop.currency}`);
  console.log(`  Timezone: ${connectionTest.shop.timezone}`);
  console.log();

  // Get counts
  console.log('📊 Getting store counts...');
  try {
    const [orderCount, productCount, customerCount] = await Promise.all([
      client.getOrderCount(),
      client.getProductCount(),
      client.getCustomerCount()
    ]);

    console.log(`  Total Orders: ${orderCount.toLocaleString()}`);
    console.log(`  Total Products: ${productCount.toLocaleString()}`);
    console.log(`  Total Customers: ${customerCount.toLocaleString()}`);
  } catch (error: any) {
    console.log(`  Could not get counts: ${error.message}`);
  }

  console.log('\n✅ Shopify integration is ready!');
  console.log('\n📝 Next steps:');
  console.log('  1. Go to Supabase SQL Editor');
  console.log('  2. Run: Document Storage/SQL/shopify_schema.sql');
  console.log('  3. Trigger sync (once API endpoint is created)');
}

testShopify().catch(console.error);
