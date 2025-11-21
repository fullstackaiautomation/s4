/**
 * Unified Daily Sync Cron Job
 *
 * Runs daily to sync GSC, Merchant Center, and GA4 data automatically.
 * Consolidates multiple cron jobs into one to stay within Vercel's free tier limits (2 cron jobs).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGSCSync } from '@/lib/integrations/gsc-sync';
import { createMerchantCenterSync } from '@/lib/integrations/merchant-center-sync';
import { createGA4Sync } from '@/lib/integrations/ga4-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
    console.log('[Daily Sync] Starting unified daily sync...');

    // Verify authorization (Vercel cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow manual triggering in dev
        if (process.env.NODE_ENV !== 'development') {
            console.error('[Daily Sync] Unauthorized: Invalid or missing cron secret');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    const results: Record<string, any> = {};
    const errors: string[] = [];

    // 1. Google Search Console Sync
    try {
        console.log('[Daily Sync] Starting GSC sync...');
        const gscSync = createGSCSync();
        if (gscSync) {
            // Sync last 7 days to catch updates
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            results.gsc = await gscSync.sync({
                fullSync: false,
                dateRange: {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                },
                syncQueries: true,
                syncPages: true,
                syncDevices: true,
                syncCountries: true,
                syncSitePerformance: true
            });
            console.log('[Daily Sync] GSC sync completed');
        } else {
            results.gsc = { success: false, error: 'GSC sync not configured' };
            errors.push('GSC sync not configured');
        }
    } catch (error: any) {
        console.error('[Daily Sync] GSC sync failed:', error);
        results.gsc = { success: false, error: error.message };
        errors.push(`GSC sync failed: ${error.message}`);
    }

    // 2. Google Merchant Center Sync
    try {
        console.log('[Daily Sync] Starting Merchant Center sync...');
        const mcSync = createMerchantCenterSync();
        if (mcSync) {
            results.merchantCenter = await mcSync.sync({ fullSync: false });
            console.log('[Daily Sync] Merchant Center sync completed');
        } else {
            results.merchantCenter = { success: false, error: 'Merchant Center sync not configured' };
            errors.push('Merchant Center sync not configured');
        }
    } catch (error: any) {
        console.error('[Daily Sync] Merchant Center sync failed:', error);
        results.merchantCenter = { success: false, error: error.message };
        errors.push(`Merchant Center sync failed: ${error.message}`);
    }

    // 3. Google Analytics 4 Sync
    try {
        console.log('[Daily Sync] Starting GA4 sync...');
        const ga4Sync = createGA4Sync();
        if (ga4Sync) {
            results.ga4 = await ga4Sync.sync({ fullSync: false });
            console.log('[Daily Sync] GA4 sync completed');
        } else {
            results.ga4 = { success: false, error: 'GA4 sync not configured' };
            errors.push('GA4 sync not configured');
        }
    } catch (error: any) {
        console.error('[Daily Sync] GA4 sync failed:', error);
        results.ga4 = { success: false, error: error.message };
        errors.push(`GA4 sync failed: ${error.message}`);
    }

    const success = errors.length === 0;
    const status = success ? 200 : 207; // 207 Multi-Status if some failed

    return NextResponse.json({
        success,
        timestamp: new Date().toISOString(),
        results,
        errors: errors.length > 0 ? errors : undefined
    }, { status });
}
