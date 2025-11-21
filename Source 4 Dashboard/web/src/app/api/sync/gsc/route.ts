/**
 * Google Search Console Sync API Endpoint
 *
 * POST /api/sync/gsc
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGSCSync } from '@/lib/integrations/gsc-sync';

export async function POST(request: NextRequest) {
  console.log('[GSC Sync API] Starting sync...');
  try {
    // Parse request body
    const body = await request.json();
    console.log('[GSC Sync API] Request body:', body);
    const {
      fullSync = false,
      dateRange,
      syncQueries = true,
      syncPages = true,
      syncDevices = true,
      syncCountries = true,
      syncSitePerformance = true
    } = body;

    // Create sync instance
    console.log('[GSC Sync API] Creating sync instance...');
    const gscSync = createGSCSync();

    if (!gscSync) {
      return NextResponse.json(
        {
          success: false,
          error: 'GSC sync not configured. Please check environment variables.',
          message: 'Missing GSC_SITE_URL or GSC_CREDENTIALS_JSON'
        },
        { status: 500 }
      );
    }

    // Run sync
    console.log('[GSC Sync API] Running sync with options:', {
      fullSync,
      dateRange,
      syncQueries,
      syncPages,
      syncDevices,
      syncCountries,
      syncSitePerformance
    });
    const result = await gscSync.sync({
      fullSync,
      dateRange,
      syncQueries,
      syncPages,
      syncDevices,
      syncCountries,
      syncSitePerformance
    });

    console.log('[GSC Sync API] Sync result:', result);
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('[GSC Sync API] Error:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'GSC sync failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'GSC Sync API',
      usage: 'POST with JSON body: { fullSync?: boolean, dateRange?: { startDate: string, endDate: string } }'
    },
    { status: 200 }
  );
}
