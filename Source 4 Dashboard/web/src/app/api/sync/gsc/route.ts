import { NextRequest, NextResponse } from 'next/server';
import { createGSCSync } from '@/lib/integrations/gsc-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  console.log('[GSC Sync API] Starting sync...');

  // Check authorization
  const authHeader = request.headers.get('authorization');
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isCron && !isDev) {
    // Check for authenticated user session
    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Check environment variables explicitly for better error reporting
    const siteUrl = process.env.GSC_SITE_URL;
    const credentialsJson = process.env.GSC_CREDENTIALS_JSON || process.env.GA4_CREDENTIALS_JSON;

    if (!siteUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing GSC_SITE_URL environment variable',
          message: 'Please add GSC_SITE_URL to your Vercel environment variables (e.g., sc-domain:example.com)'
        },
        { status: 500 }
      );
    }

    if (!credentialsJson) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing GSC_CREDENTIALS_JSON environment variable',
          message: 'Please add GSC_CREDENTIALS_JSON (or GA4_CREDENTIALS_JSON) to your Vercel environment variables'
        },
        { status: 500 }
      );
    }

    // Create sync instance
    const gscSync = createGSCSync();

    if (!gscSync) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to initialize GSC sync service',
          message: 'Could not create GSC client. Check credentials format.'
        },
        { status: 500 }
      );
    }

    // Parse date range from request body if available
    let dateRange;
    try {
      const body = await request.json();
      if (body.startDate && body.endDate) {
        dateRange = {
          startDate: body.startDate,
          endDate: body.endDate
        };
      }
    } catch (e) {
      // Ignore JSON parse error (body might be empty)
    }

    // Default to last 7 days if no range provided
    if (!dateRange) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      dateRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }

    console.log('[GSC Sync API] Syncing date range:', dateRange);

    const result = await gscSync.sync({
      fullSync: false,
      dateRange,
      syncQueries: true,
      syncPages: true,
      syncDevices: true,
      syncCountries: true,
      syncSitePerformance: true
    });

    console.log('[GSC Sync API] Sync completed:', result);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });

  } catch (error: any) {
    console.error('[GSC Sync API] Error:', error);
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
