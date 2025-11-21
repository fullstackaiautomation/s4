
const { createMerchantCenterSync } = require('./src/lib/integrations/merchant-center-sync');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runSync() {
    console.log('Starting manual sync verification...');

    try {
        const syncService = createMerchantCenterSync();

        if (!syncService) {
            console.error('Failed to create sync service. Check environment variables.');
            process.exit(1);
        }

        const result = await syncService.sync({
            fullSync: false // Incremental sync for speed
        });

        console.log('Sync Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ Sync successful!');
        } else {
            console.error('❌ Sync failed or partial success.');
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// We need to handle the TS imports since we are running node directly. 
// Actually, the project is TypeScript. Running a raw JS script importing TS files won't work easily without ts-node.
// Let's try to use the Next.js environment or just rely on the running server.
// A better approach for verification without browser is to use `curl` against the running localhost API.

console.log('Use curl to test the API endpoint instead.');
