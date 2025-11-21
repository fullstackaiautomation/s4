
import { createGA4Sync } from '../src/lib/integrations/ga4-sync';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function syncHistory() {
    console.log('🚀 Starting GA4 Historical Data Sync (2023-2025)...\n');

    // Check environment variables
    if (!process.env.GA4_PROPERTY_ID || !process.env.GA4_CREDENTIALS_JSON) {
        console.error('❌ Missing GA4 credentials in .env.local');
        process.exit(1);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const ga4Sync = createGA4Sync();
    if (!ga4Sync) {
        console.error('❌ Failed to create GA4 sync instance');
        process.exit(1);
    }

    // Define date ranges (Monthly chunks to avoid API limits)
    const years = [2023, 2024, 2025];
    const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    for (const year of years) {
        for (const month of months) {
            // Skip future months
            if (year > currentYear || (year === currentYear && month > currentMonth)) {
                continue;
            }

            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;

            // Calculate end date (last day of month)
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

            // Skip if end date is in the future, use today instead
            const endObj = new Date(year, month - 1, lastDay);
            const finalEndDate = endObj > today ? today.toISOString().split('T')[0] : endDate;

            console.log(`📅 Syncing ${startDate} to ${finalEndDate}...`);

            try {
                const result = await ga4Sync.sync({
                    dateRange: { startDate, endDate: finalEndDate },
                    syncTraffic: true,
                    syncSources: true,
                    syncPages: true,
                    syncEcommerce: true,
                    syncConversions: true
                });

                if (result.success) {
                    console.log(`✅ Synced ${result.recordsSynced} records in ${(result.duration / 1000).toFixed(1)}s`);
                } else {
                    console.error(`❌ Failed to sync ${startDate} - ${finalEndDate}:`, result.errors);
                }

                // Small pause to be nice to the API
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
                console.error(`❌ Error syncing ${startDate} - ${finalEndDate}:`, error.message);
            }
        }
    }

    console.log('\n✨ Historical sync complete!');
}

syncHistory().catch(console.error);
