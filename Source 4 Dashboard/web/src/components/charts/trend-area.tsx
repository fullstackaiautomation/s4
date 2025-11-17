"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";

type TrendAreaProps = {
  data: Array<{ date: string; revenue: number; profit: number }>;
  revenueLabel?: string;
  profitLabel?: string;
};

export function TrendArea({
  data,
  revenueLabel = "Revenue",
  profitLabel = "Profit",
}: TrendAreaProps) {
  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 32, right: 16, left: 0, bottom: 0 }} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} dy={12} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => formatCurrency(Number(value)).replace("$", "")}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.2)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
            }}
            formatter={(value, name) => {
              if (name === "profit") return [formatCurrency(Number(value)), profitLabel];
              return [formatCurrency(Number(value)), revenueLabel];
            }}
          />
          <Bar dataKey="revenue" name={revenueLabel} fill="rgba(32,71,255,0.85)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="profit" name={profitLabel} fill="rgba(15,199,198,0.85)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(32,71,255,0.85)]" />
          <span>{revenueLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(15,199,198,0.85)]" />
          <span>{profitLabel}</span>
        </div>
      </div>
    </div>
  );
}
