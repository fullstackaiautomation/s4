"use client";

import { useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

type TrendAreaProps = {
  data: Array<{ date: string; revenue: number; profit?: number }>;
  revenueLabel?: string;
  profitLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  legendPlacement?: "overlay" | "none";
  height?: number;
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
  height = 600,
}: TrendAreaProps) {
  const resolvedRevenueLabel = revenueLabel ?? primaryLabel ?? "Revenue";
  const resolvedProfitLabel = profitLabel ?? secondaryLabel ?? "Profit";

  const hasProfit = useMemo(() => data.some((item) => typeof item.profit === "number"), [data]);

  const [showRevenue, setShowRevenue] = useState(true);

  // Find indices of top 10 bars for current metric
  const top10Indices = useMemo(() => {
    const indexed = data.map((item, index) => ({
      value: showRevenue ? item.revenue : (item.profit ?? 0),
      index
    }));
    indexed.sort((a, b) => b.value - a.value);
    return new Set(indexed.slice(0, 10).map((item) => item.index));
  }, [data, showRevenue]);

  // Data with label field for top 10 only
  const dataWithLabels = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      valueLabel: top10Indices.has(index)
        ? (showRevenue ? item.revenue : (item.profit ?? 0))
        : null,
    }));
  }, [data, top10Indices, showRevenue]);

  const maxValue = useMemo(() => {
    if (!data.length) return 10000;
    const max = Math.max(...data.map((item) =>
      showRevenue ? item.revenue : (item.profit ?? 0)
    ));

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
  }, [data, showRevenue]);

  const yAxisTicks = useMemo(() => {
    const tickCount = 8;
    const step = maxValue / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
  }, [maxValue]);

  return (
    <div className="w-full">
      {legendPlacement === "overlay" && hasProfit ? (
        <div className="mb-2 flex items-center gap-2 px-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setShowRevenue(true)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              showRevenue
                ? "bg-[rgb(32,71,255)] text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {resolvedRevenueLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowRevenue(false)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              !showRevenue
                ? "bg-[rgb(15,199,198)] text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {resolvedProfitLabel}
          </button>
        </div>
      ) : null}
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataWithLabels} margin={{ top: 32, right: 16, left: 0, bottom: 0 }} barGap={6} barCategoryGap="20%">
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
              dataKey={showRevenue ? "revenue" : "profit"}
              name={showRevenue ? resolvedRevenueLabel : resolvedProfitLabel}
              fill={showRevenue ? "rgba(32,71,255,0.85)" : "rgba(15,199,198,0.85)"}
              radius={[6, 6, 0, 0]}
              barSize={32}
            >
              <LabelList
                dataKey="valueLabel"
                position="top"
                formatter={(value: number | null) => (value ? formatCompactCurrency(value) : "")}
                style={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
