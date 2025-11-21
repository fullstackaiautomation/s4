
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    const start = '2025-10-01';
    const end = '2025-10-31';
    const limit = 50;

    console.log(`1. Calculating RAW totals for "source 4 industries" (${start} to ${end})...`);
    const { data: rawData, error: rawError } = await supabase
        .from('gsc_search_queries')
        .select('clicks, impressions')
        .eq('query', 'source 4 industries')
        .gte('date', start)
        .lte('date', end);

    if (rawError) {
        console.error('Raw Query Error:', rawError);
        return;
    }

    const rawClicks = rawData.reduce((sum, r) => sum + r.clicks, 0);
    const rawImpressions = rawData.reduce((sum, r) => sum + r.impressions, 0);
    console.log(`   Raw Totals: ${rawClicks} clicks, ${rawImpressions} impressions`);

    console.log(`\n2. Testing RPC get_gsc_top_queries...`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_gsc_top_queries', {
        start_date: start,
        end_date: end,
        limit_count: limit
    });

    if (rpcError) {
        console.error('   RPC Error:', rpcError);
        console.log('\n❌ RPC Failed. Please ensure you have run the updated migration file.');
        return;
    }

    const target = rpcData.find((r: any) => r.query === 'source 4 industries');
    if (target) {
        console.log(`   RPC Result for "source 4 industries": ${target.clicks} clicks, ${target.impressions} impressions`);

        if (target.clicks === rawClicks) {
            console.log('\n✅ SUCCESS! RPC data matches raw data.');
        } else {
            console.log('\n⚠️ MISMATCH! RPC data does not match raw data.');
        }
    } else {
        console.log('   "source 4 industries" not found in top results.');
    }
}

verifyFix();
