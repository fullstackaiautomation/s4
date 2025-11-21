"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export function GSCBackfill() {
    const [loadingYear, setLoadingYear] = useState<number | null>(null);
    const [status, setStatus] = useState<Record<number, { success: boolean; message: string }>>({});
    const router = useRouter();

    const handleBackfill = async (year: number) => {
        setLoadingYear(year);
        setStatus(prev => ({ ...prev, [year]: { success: false, message: '' } })); // Reset status

        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        try {
            const response = await fetch('/api/sync/gsc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ startDate, endDate }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid server response (${response.status})`);
            }

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.message || 'Sync failed');
            }

            setStatus(prev => ({
                ...prev,
                [year]: { success: true, message: `Synced ${data.recordsSynced} records` }
            }));
            router.refresh();

        } catch (error: any) {
            setStatus(prev => ({
                ...prev,
                [year]: { success: false, message: error.message }
            }));
        } finally {
            setLoadingYear(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Historical Data Backfill</CardTitle>
                </div>
                <CardDescription>
                    Import past performance data. Run these one at a time to avoid timeouts.
                </CardDescription>
            </CardHeader>
            <div className="p-6 flex flex-col gap-4 sm:flex-row">
                {[2023, 2024, 2025].map((year) => (
                    <div key={year} className="flex flex-col gap-2 flex-1">
                        <Button
                            variant="outline"
                            onClick={() => handleBackfill(year)}
                            disabled={loadingYear !== null}
                            className="w-full justify-between"
                        >
                            <span>Sync {year}</span>
                            {loadingYear === year ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : status[year]?.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : status[year]?.message ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : null}
                        </Button>
                        {status[year]?.message && (
                            <p className={`text-xs ${status[year]?.success ? 'text-green-600' : 'text-red-500'}`}>
                                {status[year]?.message}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}
