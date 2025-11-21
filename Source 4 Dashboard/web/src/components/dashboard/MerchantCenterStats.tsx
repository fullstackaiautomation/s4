'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricTile } from '@/components/ui/metric';
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MousePointer, Eye, Percent, DollarSign } from 'lucide-react';

interface MerchantCenterStatsProps {
    performance: any[];
    products: any[];
}

export function MerchantCenterStats({ performance, products }: MerchantCenterStatsProps) {
    // Calculate totals
    const totalClicks = performance.reduce((sum, item) => sum + (item.clicks || 0), 0);
    const totalImpressions = performance.reduce((sum, item) => sum + (item.impressions || 0), 0);
    const totalRevenue = performance.reduce((sum, item) => sum + (item.conversion_value || 0), 0);

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Product status counts
    const activeProducts = products.filter(p => p.status === 'active' || p.status === 'approved').length;
    const disapprovedProducts = products.filter(p => p.status === 'disapproved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;

    // Sort performance by date for chart
    const chartData = [...performance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricTile
                    label="Total Clicks"
                    value={totalClicks.toLocaleString()}
                    icon={<MousePointer className="h-4 w-4" />}
                />
                <MetricTile
                    label="Total Impressions"
                    value={totalImpressions.toLocaleString()}
                    icon={<Eye className="h-4 w-4" />}
                />
                <MetricTile
                    label="Avg CTR"
                    value={`${avgCtr.toFixed(2)}%`}
                    icon={<Percent className="h-4 w-4" />}
                />
                <MetricTile
                    label="Total Revenue"
                    value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<DollarSign className="h-4 w-4" />}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Performance Over Time</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#2563eb"
                                        name="Clicks"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="impressions"
                                        stroke="#16a34a"
                                        name="Impressions"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Status</CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                    <span>Active</span>
                                </div>
                                <span className="font-bold">{activeProducts}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span>Disapproved</span>
                                </div>
                                <span className="font-bold">{disapprovedProducts}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <span>Pending</span>
                                </div>
                                <span className="font-bold">{pendingProducts}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total Products</span>
                                    <span className="font-bold">{products.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Products (Issues)</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeadCell>Product</TableHeadCell>
                                <TableHeadCell>Status</TableHeadCell>
                                <TableHeadCell>Issues</TableHeadCell>
                                <TableHeadCell className="text-right">Price</TableHeadCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products
                                .filter(p => p.status !== 'active' && p.status !== 'approved')
                                .slice(0, 5)
                                .map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{product.title}</span>
                                                <span className="text-xs text-muted-foreground">{product.offer_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.status === 'disapproved' ? 'danger' : 'default'}>
                                                {product.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.item_level_issues && product.item_level_issues.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {product.item_level_issues.slice(0, 2).map((issue: any, i: number) => (
                                                        <span key={i} className="text-xs text-red-500">
                                                            {issue.description}
                                                        </span>
                                                    ))}
                                                    {product.item_level_issues.length > 2 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{product.item_level_issues.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.price_value} {product.price_currency}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {products.filter(p => p.status !== 'active' && p.status !== 'approved').length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        No products with issues found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
