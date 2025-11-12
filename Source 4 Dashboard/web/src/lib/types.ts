export type TimeSeriesPoint = {
  date: string;
  value: number;
  secondary?: number;
  topReps?: Array<{ name: string; revenue: number }>;
  revenue?: number;
  orders?: number;
  avgOrderValue?: number;
  topVendors?: Array<{ name: string; revenue: number }>;
};

export type OperationalAlert = {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  createdAt?: string;
};

export type SkuRecord = {
  sku: string;
  name: string;
  category: string;
  vendor: string;
  status: string;
  price: number;
  cost: number;
};

export type ReviewsBlueprint = {
  id: string;
  productId: string;
  name: string;
  description: string;
  prompts: string[];
  targetPersona: string;
  productName: string;
  keyBenefits: string[];
  tone: string;
};

export type Quote = {
  id: string;
  vendor: string;
  rep: string;
  amount: number;
  value: number;
  date: string;
  createdAt: string;
  closeDate?: string;
  status: "open" | "won" | "lost";
};
