
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkSyncStatus() {
    console.log('📊 Checking GA4 Data Sync Status...\n');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const tables = [
        'ga4_daily_traffic',
        'ga4_traffic_sources',
        'ga4_page_performance',
        'ga4_ecommerce_transactions',
        'ga4_conversions'
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Error checking ${table}:`, error.message);
        } else {
            console.log(`✅ ${table}: ${count} records`);
        }
    }

    console.log('\n📅 Records by Year (Daily Traffic):');

    const { data, error } = await supabase
        .from('ga4_daily_traffic')
        .select('date');

    if (error) {
        console.error('❌ Error fetching dates:', error.message);
    } else if (data) {
        const byYear = data.reduce((acc, row) => {
            const year = row.date.substring(0, 4);
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});

        Object.entries(byYear).sort().forEach(([year, count]) => {
            console.log(`  ${year}: ${count} days`);
        });
    }
}

checkSyncStatus().catch(console.error);
