"use client";

import { useMemo, useState } from "react";
import { TrendingUp, MousePointer, Eye, Search } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTile } from "@/components/ui/metric";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatPercent } from "@/lib/utils";
import type {
    getGSCOverview,
    getGSCTopQueries,
    getGSCTopPages,
    getGSCDeviceBreakdown
} from "@/lib/data-service";

type GSCOverviewResult = Awaited<ReturnType<typeof getGSCOverview>>;
type GSCTopQueriesResult = Awaited<ReturnType<typeof getGSCTopQueries>>;
type GSCTopPagesResult = Awaited<ReturnType<typeof getGSCTopPages>>;
type GSCDeviceBreakdownResult = Awaited<ReturnType<typeof getGSCDeviceBreakdown>>;

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type GSCDashboardClientProps = {
    overview: GSCOverviewResult;
    topQueries: GSCTopQueriesResult;
    topPages: GSCTopPagesResult;
    deviceBreakdown: GSCDeviceBreakdownResult;
    currentStartDate?: string;
    currentEndDate?: string;
};

export function GSCDashboardClient({
    overview,
    topQueries,
    topPages,
    deviceBreakdown,
    currentStartDate,
    currentEndDate,
}: GSCDashboardClientProps) {

    const metrics = overview.data;

    const getDelta = (change: number, inverse = false) => {
        if (!change) return undefined;
        const value = formatPercent(Math.abs(change));
        const isPositive = change > 0;
        const direction = inverse
            ? (isPositive ? "down" : "up")
            : (isPositive ? "up" : "down");

        return {
            value,
            direction: direction as "up" | "down" | "flat"
        };
    };

    const router = useRouter();
    const searchParams = useSearchParams();

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams);
        const now = new Date();
        let start = new Date();

        if (range === '7d') start.setDate(now.getDate() - 7);
        if (range === '30d') start.setDate(now.getDate() - 30);
        if (range === '90d') start.setDate(now.getDate() - 90);
        if (range === 'ytd') start = new Date(now.getFullYear(), 0, 1);
        if (range === '12m') start.setFullYear(now.getFullYear() - 1);
        if (range === 'all') start = new Date(2020, 0, 1); // Arbitrary old date

        params.set('from', start.toISOString().split('T')[0]);
        params.set('to', now.toISOString().split('T')[0]);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-8 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader
                    title="Google Search Console"
                    description="Organic search performance and visibility"
                />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('7d')}>7D</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('30d')}>30D</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('90d')}>90D</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('ytd')}>YTD</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('12m')}>12M</Button>
                    <Button variant="outline" size="sm" onClick={() => handleRangeChange('all')}>All</Button>
                </div>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricTile
                    label="Total Clicks"
                    value={formatNumber(metrics.totalClicks)}
                    icon={<MousePointer className="h-5 w-5" />}
                    delta={getDelta(metrics.clicksChange)}
                />
                <MetricTile
                    label="Total Impressions"
                    value={formatNumber(metrics.totalImpressions)}
                    icon={<Eye className="h-5 w-5" />}
                    delta={getDelta(metrics.impressionsChange)}
                />
                <MetricTile
                    label="Avg CTR"
                    value={formatPercent(metrics.avgCtr / 100, 1)}
                    icon={<TrendingUp className="h-5 w-5" />}
                    delta={getDelta(metrics.ctrChange)}
                />
                <MetricTile
                    label="Avg Position"
                    value={metrics.avgPosition.toFixed(1)}
                    icon={<Search className="h-5 w-5" />}
                    delta={getDelta(metrics.positionChange, true)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Queries Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Search Queries</CardTitle>
                        <CardDescription>Queries driving the most traffic</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeadCell>Query</TableHeadCell>
                                    <TableHeadCell className="text-right">Clicks</TableHeadCell>
                                    <TableHeadCell className="text-right">Impressions</TableHeadCell>
                                    <TableHeadCell className="text-right">CTR</TableHeadCell>
                                    <TableHeadCell className="text-right">Position</TableHeadCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topQueries.data.slice(0, 10).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{row.query}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                                        <TableCell className="text-right">{formatPercent(row.ctr, 1)}</TableCell>
                                        <TableCell className="text-right">{row.position.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Top Pages Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Pages</CardTitle>
                        <CardDescription>Pages with highest organic visibility</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeadCell>Page</TableHeadCell>
                                    <TableHeadCell className="text-right">Clicks</TableHeadCell>
                                    <TableHeadCell className="text-right">Impressions</TableHeadCell>
                                    <TableHeadCell className="text-right">CTR</TableHeadCell>
                                    <TableHeadCell className="text-right">Position</TableHeadCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topPages.data.slice(0, 10).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium truncate max-w-[200px]" title={row.page}>
                                            {row.page.replace('https://source4.vercel.app', '')}
                                        </TableCell>
                                        <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                                        <TableCell className="text-right">{formatPercent(row.ctr, 1)}</TableCell>
                                        <TableCell className="text-right">{row.position.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
