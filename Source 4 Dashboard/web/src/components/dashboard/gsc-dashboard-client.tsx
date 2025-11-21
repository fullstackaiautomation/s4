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
    getGSCDeviceBreakdown,
    getGSCDailyPerformance
} from "@/lib/data-service";

type GSCOverviewResult = Awaited<ReturnType<typeof getGSCOverview>>;
type GSCTopQueriesResult = Awaited<ReturnType<typeof getGSCTopQueries>>;
type GSCTopPagesResult = Awaited<ReturnType<typeof getGSCTopPages>>;
type GSCDeviceBreakdownResult = Awaited<ReturnType<typeof getGSCDeviceBreakdown>>;
type GSCDailyPerformanceResult = Awaited<ReturnType<typeof getGSCDailyPerformance>>;

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

type GSCDashboardClientProps = {
    overview: GSCOverviewResult;
    topQueries: GSCTopQueriesResult;
    topPages: GSCTopPagesResult;
    deviceBreakdown: GSCDeviceBreakdownResult;
    dailyPerformance: GSCDailyPerformanceResult;
    currentStartDate?: string;
    currentEndDate?: string;
};

export function GSCDashboardClient({
    overview,
    topQueries,
    topPages,
    deviceBreakdown,
    dailyPerformance,
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
    const activeRange = searchParams.get('range') || '30d';

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams);
        const now = new Date();
        let start = new Date();
        let end = new Date();

        // Standard ranges (end date is today)
        if (range === '7d') start.setDate(now.getDate() - 7);
        if (range === '30d') start.setDate(now.getDate() - 30);
        if (range === '90d') start.setDate(now.getDate() - 90);
        if (range === 'ytd') start = new Date(now.getFullYear(), 0, 1);
        if (range === '12m') start.setFullYear(now.getFullYear() - 1);
        if (range === 'all') start = new Date(2020, 0, 1);

        // Specific years
        if (range === '2025') {
            start = new Date('2025-01-01');
            end = new Date('2025-12-31');
        }
        if (range === '2024') {
            start = new Date('2024-01-01');
            end = new Date('2024-12-31');
        }
        if (range === '2023') {
            start = new Date('2023-01-01');
            end = new Date('2023-12-31');
        }

        // Month ranges
        if (range === 'this_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
        }
        if (range === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        params.set('from', start.toISOString().split('T')[0]);
        params.set('to', end.toISOString().split('T')[0]);
        params.set('range', range);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-8 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader
                    title="Google Search Console"
                    description="Organic search performance and visibility"
                />
                <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant={activeRange === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('all')}>All</Button>
                    <Button variant={activeRange === '2025' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('2025')}>2025</Button>
                    <Button variant={activeRange === '2024' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('2024')}>2024</Button>
                    <Button variant={activeRange === '2023' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('2023')}>2023</Button>
                    <Button variant={activeRange === '90d' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('90d')}>90D</Button>
                    <Button variant={activeRange === '30d' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('30d')}>30D</Button>
                    <Button variant={activeRange === '7d' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('7d')}>7D</Button>
                    <Button variant={activeRange === 'this_month' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('this_month')}>This Month</Button>
                    <Button variant={activeRange === 'last_month' ? 'primary' : 'outline'} size="sm" onClick={() => handleRangeChange('last_month')}>Last Month</Button>
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
                    value={formatPercent(metrics.avgCtr, 1)}
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

            {/* Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>Daily clicks and impressions</CardDescription>
                </CardHeader>
                <div className="p-6 pl-0 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyPerformance.data}>
                            <defs>
                                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            />
                            <Legend />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="clicks"
                                name="Clicks"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorClicks)"
                                strokeWidth={2}
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="impressions"
                                name="Impressions"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#colorImpressions)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

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
