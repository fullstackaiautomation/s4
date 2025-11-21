/**
 * Google Search Console Cron Job
 *
 * Runs daily to sync GSC data automatically
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGSCSync } from '@/lib/integrations/gsc-sync';

export async function GET(request: NextRequest) {
  console.log('[GSC Cron] Starting daily sync...');

  // Verify authorization (Vercel cron secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[GSC Cron] Unauthorized: Invalid or missing cron secret');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Create sync instance
    const gscSync = createGSCSync();

    if (!gscSync) {
      console.error('[GSC Cron] GSC sync not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'GSC sync not configured. Check environment variables.',
          message: 'Missing GSC_SITE_URL or GSC_CREDENTIALS_JSON'
        },
        { status: 500 }
      );
    }

    // Sync last 7 days (to catch any updates from Google)
    // GSC data has 2-3 day delay, so we sync recent days to capture final data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

    console.log('[GSC Cron] Syncing date range:', dateRange);

    const result = await gscSync.sync({
      fullSync: false,
      dateRange,
      syncQueries: true,
      syncPages: true,
      syncDevices: true,
      syncCountries: true,
      syncSitePerformance: true
    });

    console.log('[GSC Cron] Sync completed:', result);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });

  } catch (error: any) {
    console.error('[GSC Cron] Error:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'GSC cron job failed'
      },
      { status: 500 }
    );
  }
}
