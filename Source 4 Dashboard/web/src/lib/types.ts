export type TimeSeriesPoint = {
  date: string;
  value: number;
  secondary?: number;
};

export type OperationalAlert = {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
};

export type SkuRecord = {
  sku: string;
  name: string;
  category: string;
  vendor: string;
  status: string;
  price?: number;
  cost?: number;
};

export type ReviewsBlueprint = {
  id: string;
  name: string;
  description: string;
  prompts: string[];
};

export type Quote = {
  id: string;
  vendor: string;
  rep: string;
  amount: number;
  date: string;
};
