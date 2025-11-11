import { OperationalAlert, Quote, SkuRecord } from "./types";

export const SAMPLE_ALERTS: OperationalAlert[] = [
  {
    id: "alert-1",
    level: "warning",
    message: "High inventory turnover on premium SKUs",
  },
  {
    id: "alert-2",
    level: "info",
    message: "Monthly performance targets on track",
  },
];

export const SAMPLE_QUOTES: Quote[] = [
  {
    id: "q1",
    vendor: "Vendor A",
    rep: "John Smith",
    amount: 15000,
    date: "2024-11-01",
  },
  {
    id: "q2",
    vendor: "Vendor B",
    rep: "Jane Doe",
    amount: 22500,
    date: "2024-11-02",
  },
  {
    id: "q3",
    vendor: "Vendor A",
    rep: "John Smith",
    amount: 18900,
    date: "2024-11-03",
  },
  {
    id: "q4",
    vendor: "Vendor C",
    rep: "Bob Wilson",
    amount: 31200,
    date: "2024-11-04",
  },
  {
    id: "q5",
    vendor: "Vendor B",
    rep: "Jane Doe",
    amount: 28500,
    date: "2024-11-05",
  },
];

export const SAMPLE_SKUS: SkuRecord[] = [
  {
    sku: "SKU-001",
    name: "Premium Widget A",
    category: "Electronics",
    vendor: "Vendor A",
    status: "active",
    price: 299.99,
    cost: 150,
  },
  {
    sku: "SKU-002",
    name: "Standard Widget B",
    category: "Electronics",
    vendor: "Vendor B",
    status: "active",
    price: 149.99,
    cost: 75,
  },
  {
    sku: "SKU-003",
    name: "Premium Widget C",
    category: "Hardware",
    vendor: "Vendor C",
    status: "active",
    price: 449.99,
    cost: 225,
  },
  {
    sku: "SKU-004",
    name: "Standard Widget D",
    category: "Accessories",
    vendor: "Vendor A",
    status: "inactive",
    price: 49.99,
    cost: 25,
  },
  {
    sku: "SKU-005",
    name: "Premium Widget E",
    category: "Hardware",
    vendor: "Vendor B",
    status: "active",
    price: 599.99,
    cost: 300,
  },
];
