
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRevenueData() {
    console.log('Checking GA4 Revenue Data...');

    // Check ga4_conversions
    const { data: conversions, error: convError } = await supabase
        .from('ga4_conversions')
        .select('date, conversion_value, conversions')
        .order('date', { ascending: true });

    if (convError) {
        console.error('Error fetching conversions:', convError);
        return;
    }

    console.log(`Total conversion records: ${conversions.length}`);

    // Aggregate by month
    const monthlyRevenue: Record<string, number> = {};
    const monthlyConversions: Record<string, number> = {};

    conversions.forEach(row => {
        const month = row.date.substring(0, 7); // YYYY-MM
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + row.conversion_value;
        monthlyConversions[month] = (monthlyConversions[month] || 0) + row.conversions;
    });

    console.log('\nMonthly Revenue & Conversions:');
    Object.keys(monthlyRevenue).sort().forEach(month => {
        console.log(`${month}: $${monthlyRevenue[month].toFixed(2)} (${monthlyConversions[month]} conversions)`);
    });

    // Check ga4_daily_traffic to see if we have traffic but no revenue
    const { data: traffic, error: trafficError } = await supabase
        .from('ga4_daily_traffic')
        .select('date')
        .order('date', { ascending: true });

    if (trafficError) {
        console.error('Error fetching traffic:', trafficError);
        return;
    }

    const monthlyTraffic: Record<string, number> = {};
    traffic.forEach(row => {
        const month = row.date.substring(0, 7);
        monthlyTraffic[month] = (monthlyTraffic[month] || 0) + 1;
    });

    console.log('\nMonthly Traffic Records (Days with data):');
    Object.keys(monthlyTraffic).sort().forEach(month => {
        console.log(`${month}: ${monthlyTraffic[month]} days`);
    });

}

checkRevenueData();
