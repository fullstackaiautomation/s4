import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await getSupabaseServerClient();

        // Simple check to verify connection
        const { data, error } = await supabase.from('gsc_dashboard_view').select('count').single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'GSC Debug endpoint ready', data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
