'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SyncButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/sync/merchant-center', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.errors?.[0] || 'Sync failed');
            }

            router.refresh();
            alert(`Sync complete! ${data.message || ''}`);
        } catch (error) {
            console.error('Error syncing:', error);
            alert('Failed to sync data. Check console for details.');
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
