"use client";

import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";

type TrendAreaProps = {
  data: Array<{ date: string; revenue: number; profit?: number }>;
  revenueLabel?: string;
  profitLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  legendPlacement?: "overlay" | "none";
};

type TooltipEntry = {
  dataKey?: string;
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  revenueLabel: string;
  profitLabel: string;
};

const CustomTooltip = ({ active, payload, label, revenueLabel, profitLabel }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: "10px",
          padding: "12px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey ?? "unknown"} style={{ padding: "4px 0" }}>
            <span style={{ color: entry.dataKey === "revenue" ? "rgba(32,71,255,1)" : "rgba(15,199,198,1)" }}>
              <span style={{ fontWeight: 500 }}>
                {entry.dataKey === "revenue" ? revenueLabel : profitLabel}:{" "}
              </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(Number(entry.value ?? 0))}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendArea({
  data,
  revenueLabel,
  profitLabel,
  primaryLabel,
  secondaryLabel,
  legendPlacement = "overlay",
}: TrendAreaProps) {
  const resolvedRevenueLabel = revenueLabel ?? primaryLabel ?? "Revenue";
  const resolvedProfitLabel = profitLabel ?? secondaryLabel ?? "Profit";

  const hasProfit = useMemo(() => data.some((item) => typeof item.profit === "number"), [data]);

  const maxValue = useMemo(() => {
    if (!data.length) return 10000;
    const max = Math.max(...data.map((item) => Math.max(item.revenue, item.profit ?? 0)));

    // Determine appropriate rounding based on scale
    let roundTo: number;
    if (max < 10000) {
      roundTo = 1000; // Round to nearest 1k
    } else if (max < 100000) {
      roundTo = 10000; // Round to nearest 10k
    } else {
      roundTo = 100000; // Round to nearest 100k
    }

    return Math.ceil(max / roundTo) * roundTo;
  }, [data]);

  const yAxisTicks = useMemo(() => {
    const tickCount = 8;
    const step = maxValue / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
  }, [maxValue]);

  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 32, right: 16, left: 0, bottom: 0 }} barGap={6} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} dy={12} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => formatCurrency(Number(value)).replace("$", "")}
            width={70}
            domain={[0, maxValue]}
            ticks={yAxisTicks}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            content={<CustomTooltip revenueLabel={resolvedRevenueLabel} profitLabel={resolvedProfitLabel} />}
          />
          <Bar
            dataKey="revenue"
            name={resolvedRevenueLabel}
            fill="rgba(32,71,255,0.85)"
            radius={[6, 6, 0, 0]}
            barSize={32}
          />
          {hasProfit ? (
            <Bar
              dataKey="profit"
              name={resolvedProfitLabel}
              fill="rgba(15,199,198,0.85)"
              radius={[6, 6, 0, 0]}
              barSize={32}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="revenue"
            name={`${resolvedRevenueLabel} Trend`}
            stroke="rgba(32,71,255,1)"
            strokeWidth={3}
            dot={{ r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
      {legendPlacement === "overlay" ? (
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgba(32,71,255,0.85)]" />
            <span>{resolvedRevenueLabel}</span>
          </div>
          {hasProfit ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(15,199,198,0.85)]" />
              <span>{resolvedProfitLabel}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
