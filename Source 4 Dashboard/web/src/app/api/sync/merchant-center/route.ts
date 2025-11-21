import { NextResponse } from 'next/server';
import { createMerchantCenterSync } from '@/lib/integrations/merchant-center-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Allow manual triggering in dev or if authenticated as admin (simplified here)
            // For now, just check cron secret or if in dev
            if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { searchParams } = new URL(request.url);
        const fullSync = searchParams.get('full') === 'true';

        const syncService = createMerchantCenterSync();

        if (!syncService) {
            return NextResponse.json({
                error: 'Merchant Center Sync not configured. Check environment variables.'
            }, { status: 500 });
        }

        const result = await syncService.sync({
            fullSync
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return GET(request);
}
