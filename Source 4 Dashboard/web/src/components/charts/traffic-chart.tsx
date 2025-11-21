"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { useId } from "react";
import { formatNumber } from "@/lib/utils";

type TrafficChartProps = {
    data: Array<any>;
    xKey: string;
    yKeys: string[];
    colors: string[];
    height?: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                <p className="mb-2 font-semibold text-foreground">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 py-0.5">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium text-muted-foreground">
                            {entry.name}:
                        </span>
                        <span className="text-sm font-bold text-foreground">
                            {formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function TrafficChart({
    data,
    xKey,
    yKeys,
    colors,
    height = 400,
}: TrafficChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex w-full items-center justify-center text-muted-foreground" style={{ height: `${height}px` }}>
                No data available
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                        opacity={0.4}
                    />
                    <XAxis
                        dataKey={xKey}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => formatNumber(value)}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    {yKeys.map((key, index) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.2}
                            isAnimationActive={false}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
