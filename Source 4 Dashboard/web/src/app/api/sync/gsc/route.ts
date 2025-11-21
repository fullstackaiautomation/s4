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
    // Create sync instance
    const gscSync = createGSCSync();

    if (!gscSync) {
      return NextResponse.json(
        {
          success: false,
          error: 'GSC sync not configured. Check environment variables.',
        },
        { status: 500 }
      );
    }

    // Sync last 7 days to catch any updates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

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
