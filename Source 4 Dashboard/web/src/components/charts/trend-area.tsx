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

import { TimeSeriesPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type TrendAreaProps = {
  data: TimeSeriesPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
};

export function TrendArea({ data, primaryLabel = "Primary", secondaryLabel = "Secondary" }: TrendAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(32,71,255,0.5)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="rgba(32,71,255,0.1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(15,199,198,0.4)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="rgba(15,199,198,0.05)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} dy={12} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickFormatter={(value) => formatCurrency(Number(value)).replace("$", "")}
          width={60}
        />
        <Tooltip
          cursor={{ stroke: "rgba(148,163,184,0.4)", strokeWidth: 1 }}
          contentStyle={{ borderRadius: 10, border: "1px solid rgba(148,163,184,0.2)", boxShadow: "0 10px 30px rgba(15,23,42,0.12)" }}
          formatter={(value, name) => {
            if (name === "secondary") return [formatCurrency(Number(value)), secondaryLabel];
            return [formatCurrency(Number(value)), primaryLabel];
          }}
        />
        <Area type="monotone" dataKey="value" stroke="rgba(32,71,255,0.8)" fill="url(#colorPrimary)" strokeWidth={2.5} />
        <Area type="monotone" dataKey="secondary" stroke="rgba(15,199,198,0.8)" fill="url(#colorSecondary)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
