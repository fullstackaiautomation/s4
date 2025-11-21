import { Suspense } from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { MerchantCenterStats } from '@/components/dashboard/MerchantCenterStats';
import { SyncButton } from '@/components/dashboard/SyncButton';

export const metadata = {
    title: 'Google Merchant Center | Source 4 Dashboard',
    description: 'Analytics and product status from Google Merchant Center',
};

export default async function MerchantCenterPage() {
    const supabase = await getSupabaseServerClient();

    // Fetch performance data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: performance } = await supabase
        .from('gmc_performance')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

    // Fetch products data
    const { data: products } = await supabase
        .from('gmc_products')
        .select('*');

    // Fetch last sync time
    const { data: lastSync } = await supabase
        .from('gmc_sync_log')
        .select('*')
        .order('sync_completed_at', { ascending: false })
        .limit(1)
        .single();

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Google Merchant Center</h1>
                    <p className="text-muted-foreground">
                        Product performance and status overview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {lastSync && (
                        <span className="text-sm text-muted-foreground">
                            Last synced: {new Date(lastSync.sync_completed_at).toLocaleString()}
                        </span>
                    )}
                    <SyncButton />
                </div>
            </div>

            <Suspense fallback={<div>Loading stats...</div>}>
                <MerchantCenterStats
                    performance={performance || []}
                    products={products || []}
                />
            </Suspense>
        </div>
    );
}
