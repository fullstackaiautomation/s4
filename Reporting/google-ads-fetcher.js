/**
 * Google Ads Campaign Performance Fetcher
 * Fetches campaign data using Google Ads API
 * Run with: node google-ads-fetcher.js [start-date] [end-date]
 * Example: node google-ads-fetcher.js 2024-09-01 2024-09-30
 */

const { GoogleAdsApi } = require('google-ads-api');

// Configuration from environment or hardcoded
const CONFIG = {
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'YOUR_DEVELOPER_TOKEN',
  clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'YOUR_REFRESH_TOKEN',
  customerId: process.env.GOOGLE_CUSTOMER_ID || 'YOUR_CUSTOMER_ID',
};

// Parse command line arguments for date range
const args = process.argv.slice(2);
const startDate = args[0] || '2024-09-01';
const endDate = args[1] || '2024-09-30';

console.log(`\n📊 Fetching Google Ads data for Customer ID: ${CONFIG.customerId}`);
console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);

async function fetchCampaignPerformance() {
  try {
    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: CONFIG.clientId,
      client_secret: CONFIG.clientSecret,
      developer_token: CONFIG.developerToken,
    });

    // Get customer instance
    const customer = client.Customer({
      customer_id: CONFIG.customerId,
      refresh_token: CONFIG.refreshToken,
    });

    // Query for campaign performance metrics
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
    `;

    console.log('🔄 Fetching campaign data...\n');

    // Execute query
    const campaigns = await customer.query(query);

    // Process and display results
    console.log('✅ Campaign Performance Data:\n');
    console.log('━'.repeat(100));

    let totalCost = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalConversionValue = 0;

    const results = [];

    for (const row of campaigns) {
      const cost = row.metrics.cost_micros / 1000000; // Convert micros to currency
      const conversionValue = row.metrics.conversions_value || 0;
      const roi = cost > 0 ? ((conversionValue - cost) / cost * 100) : 0;

      totalCost += cost;
      totalImpressions += row.metrics.impressions;
      totalClicks += row.metrics.clicks;
      totalConversions += row.metrics.conversions;
      totalConversionValue += conversionValue;

      const result = {
        'Campaign ID': row.campaign.id,
        'Campaign Name': row.campaign.name,
        'Status': row.campaign.status,
        'Impressions': row.metrics.impressions.toLocaleString(),
        'Clicks': row.metrics.clicks.toLocaleString(),
        'Cost': `$${cost.toFixed(2)}`,
        'CTR': `${(row.metrics.ctr * 100).toFixed(2)}%`,
        'Avg CPC': `$${(row.metrics.average_cpc / 1000000).toFixed(2)}`,
        'Conversions': row.metrics.conversions.toFixed(2),
        'Conv. Value': `$${conversionValue.toFixed(2)}`,
        'ROI': `${roi.toFixed(2)}%`,
      };

      results.push(result);
      console.table([result]);
    }

    console.log('━'.repeat(100));
    console.log('\n📈 TOTALS:');
    console.log(`   Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`   Total Impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`   Total Clicks: ${totalClicks.toLocaleString()}`);
    console.log(`   Total Conversions: ${totalConversions.toFixed(2)}`);
    console.log(`   Total Conversion Value: $${totalConversionValue.toFixed(2)}`);
    console.log(`   Overall ROI: ${totalCost > 0 ? ((totalConversionValue - totalCost) / totalCost * 100).toFixed(2) : 0}%\n`);

    // Export to JSON file
    const fs = require('fs');
    const outputFile = `google-ads-export-${startDate}-to-${endDate}.json`;

    const exportData = {
      metadata: {
        customerId: CONFIG.customerId,
        dateRange: { start: startDate, end: endDate },
        exportedAt: new Date().toISOString(),
      },
      summary: {
        totalCost,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalConversionValue,
        overallROI: totalCost > 0 ? ((totalConversionValue - totalCost) / totalCost * 100) : 0,
      },
      campaigns: results,
    };

    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    console.log(`💾 Data exported to: ${outputFile}\n`);

    return results;

  } catch (error) {
    console.error('\n❌ Error fetching Google Ads data:');
    console.error(error.message);
    if (error.errors) {
      console.error('\nDetailed errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.error_code?.authentication_error || err.message}`);
      });
    }
    process.exit(1);
  }
}

// Run the script
fetchCampaignPerformance();
