import type { TimeRange } from "@/components/providers/dashboard-filters";

import { TopProductsClient, TopProduct } from "./top-products-client";
import { getTopProducts } from "@/lib/data-service";

const TIME_RANGES: TimeRange[] = ["last-7", "last-30", "quarter", "year", "all"];

function resolveDateRange(range: TimeRange): { start: string; end: string } | undefined {
  if (range === "all") return undefined;

  const daysMap: Record<Exclude<TimeRange, "all">, number> = {
    "last-7": 7,
    "last-30": 30,
    quarter: 90,
    year: 365,
  };

  const days = daysMap[range as Exclude<TimeRange, "all">];
  if (!days) return undefined;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function TopProductsPage() {
  const entries = await Promise.all(
    TIME_RANGES.map(async (range) => {
      const response = await getTopProducts(50, resolveDateRange(range));
      return [range, response] as const;
    }),
  );

  const datasets = entries.reduce(
    (acc, [range, response]) => {
      acc[range] = {
        data: response.data as TopProduct[],
        error: response.error,
        refreshedAt: response.refreshedAt,
      };
      return acc;
    },
    {} as Record<TimeRange, { data: TopProduct[]; error?: string; refreshedAt?: string }>,
  );

  return <TopProductsClient datasets={datasets} />;
}