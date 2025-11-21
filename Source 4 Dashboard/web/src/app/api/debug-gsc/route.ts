import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const supabase = await getSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || 'source 4 industries';
        const start = searchParams.get('start') || '2025-10-01';
        const end = searchParams.get('end') || '2025-10-31';

        // Get daily breakdown for this query
        const { data: dailyData, error } = await supabase
            .from('gsc_search_queries')
            .select('date, query, clicks, impressions, position')
            .eq('query', query)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });

        if (error) throw error;

        // Calculate totals
        const totalClicks = dailyData.reduce((sum, row) => sum + (row.clicks || 0), 0);
        const totalImpressions = dailyData.reduce((sum, row) => sum + (row.impressions || 0), 0);
        const daysFound = dailyData.length;

        return NextResponse.json({
            summary: {
                query,
                dateRange: { start, end },
                totalClicks,
                totalImpressions,
                daysWithData: daysFound,
            },
            dailyData
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
