import { TimeRange } from "@/components/providers/dashboard-filters";

const TIME_RANGE_TO_DAYS: Record<Exclude<TimeRange, "all">, number> = {
  "last-month": 30,
  "last-7": 7,
  "last-30": 30,
  quarter: 90,
  year: 365,
};

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subtractDays(anchor: Date, days: number) {
  const result = new Date(anchor);
  result.setDate(result.getDate() - (days - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getRangeBounds(timeRange: TimeRange, candidates: Array<Date | null | undefined>) {
  const validDates = candidates
    .map((item) => parseDate(item ?? null))
    .filter((item): item is Date => Boolean(item))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!validDates.length) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return {
      start: timeRange === "all" ? null : subtractDays(today, TIME_RANGE_TO_DAYS[timeRange] ?? 0),
      end: today,
    };
  }

  const latest = validDates.at(-1)!;
  const end = new Date(latest);
  end.setHours(23, 59, 59, 999);

  if (timeRange === "all") {
    return { start: null, end };
  }

  const days = TIME_RANGE_TO_DAYS[timeRange as Exclude<TimeRange, "all">];
  if (!days) {
    return { start: null, end };
  }

  return {
    start: subtractDays(latest, days),
    end,
  };
}

export function withinRange(date: Date | null, start: Date | null, end: Date | null) {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}
