/**
 * Google Analytics 4 Sync API Endpoint
 *
 * POST /api/sync/ga4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGA4Sync } from '@/lib/integrations/ga4-sync';

export async function POST(request: NextRequest) {
  console.log('[GA4 Sync API] Starting sync...');
  try {
    // Parse request body
    const body = await request.json();
    console.log('[GA4 Sync API] Request body:', body);
    const {
      fullSync = false,
      dateRange,
      syncTraffic = true,
      syncSources = true,
      syncPages = true,
      syncEcommerce = true,
      syncConversions = true
    } = body;

    // Create sync instance
    console.log('[GA4 Sync API] Creating sync instance...');
    const ga4Sync = createGA4Sync();

    if (!ga4Sync) {
      return NextResponse.json(
        {
          success: false,
          error: 'GA4 sync not configured. Please check environment variables.',
          message: 'Missing GA4_PROPERTY_ID or GA4_CREDENTIALS_JSON'
        },
        { status: 500 }
      );
    }

    // Run sync
    console.log('[GA4 Sync API] Running sync with options:', { fullSync, dateRange, syncTraffic, syncSources, syncPages, syncEcommerce, syncConversions });
    const result = await ga4Sync.sync({
      fullSync,
      dateRange,
      syncTraffic,
      syncSources,
      syncPages,
      syncEcommerce,
      syncConversions
    });

    console.log('[GA4 Sync API] Sync result:', result);
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('[GA4 Sync API] Error:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'GA4 sync failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'GA4 Sync API',
      usage: 'POST with JSON body: { fullSync?: boolean, dateRange?: { startDate: string, endDate: string } }'
    },
    { status: 200 }
  );
}
