'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SyncButton({ endpoint = '/api/sync/merchant-center' }: { endpoint?: string }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.errors?.[0] || 'Sync failed');
            }

            router.refresh();
            alert(`Sync complete! ${data.message || ''}`);
        } catch (error: any) {
            console.error('Error syncing:', error);
            alert(`Failed to sync data: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
        >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
    );
}
