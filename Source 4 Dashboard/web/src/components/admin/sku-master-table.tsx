"use client";

import { useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { SkuRecord } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  records: SkuRecord[];
};

export function SkuMasterTable({ records }: Props) {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const vendors = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.vendor))).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesVendor = vendorFilter === "all" || record.vendor === vendorFilter;
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesSearch = search
        ? record.sku.toLowerCase().includes(search.toLowerCase()) ||
          record.name.toLowerCase().includes(search.toLowerCase()) ||
          record.category.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesVendor && matchesStatus && matchesSearch;
    });
  }, [records, search, vendorFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          placeholder="Search SKU, name, or category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={vendorFilter}
            onChange={(event) => setVendorFilter(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadCell>SKU</TableHeadCell>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Vendor</TableHeadCell>
            <TableHeadCell>Category</TableHeadCell>
            <TableHeadCell className="text-right">Price</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((record) => (
            <TableRow key={record.sku}>
              <TableCell className="font-mono text-xs">{record.sku}</TableCell>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.vendor}</TableCell>
              <TableCell className="capitalize">{record.category}</TableCell>
              <TableCell className="text-right">{formatCurrency(record.price)}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    record.status === "active"
                      ? "bg-success/10 text-success"
                      : record.status === "inactive"
                        ? "bg-warning/10 text-warning"
                        : "bg-danger/10 text-danger",
                  )}
                >
                  {record.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
