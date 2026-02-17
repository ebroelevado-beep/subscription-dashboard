"use client";

import { useState } from "react";
import {
  useAnalyticsHistory,
  type HistoryFilters,
  type HistoryRow,
} from "@/hooks/use-analytics";
import { usePlatforms } from "@/hooks/use-platforms";
import { usePlans } from "@/hooks/use-plans";
import { downloadCSV } from "@/lib/csv-export";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<HistoryRow>();

const columns = [
  columnHelper.accessor("paidOn", {
    header: "Date",
    cell: (info) => (
      <span className="font-medium tabular-nums">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => {
      const type = info.getValue();
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            type === "income"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          )}
        >
          {type === "income" ? (
            <ArrowUpCircle className="size-3" />
          ) : (
            <ArrowDownCircle className="size-3" />
          )}
          {type === "income" ? "Income" : "Cost"}
        </span>
      );
    },
  }),
  columnHelper.accessor("amount", {
    header: () => <span className="text-right block">Amount</span>,
    cell: (info) => (
      <span
        className={cn(
          "block text-right font-semibold tabular-nums",
          info.row.original.type === "income"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {info.row.original.type === "income" ? "+" : "−"}€
        {info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor("platform", { header: "Platform" }),
  columnHelper.accessor("plan", { header: "Plan" }),
  columnHelper.accessor("subscriptionLabel", { header: "Subscription" }),
  columnHelper.accessor("clientName", {
    header: "Client",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("periodStart", {
    header: "Period",
    cell: (info) => (
      <span className="tabular-nums text-muted-foreground text-xs">
        {info.getValue()} → {info.row.original.periodEnd}
      </span>
    ),
  }),
  columnHelper.accessor("notes", {
    header: "Notes",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="max-w-[200px] truncate block text-xs" title={val}>
          {val}
        </span>
      );
    },
  }),
];

export default function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>({
    page: 1,
    pageSize: 20,
    type: "all",
  });

  const { data, isLoading } = useAnalyticsHistory(filters);
  const { data: platforms } = usePlatforms();
  const { data: plans } = usePlans();

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const updateFilter = (key: keyof HistoryFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: key !== "page" ? 1 : prev.page,
    }));
  };

  const handleExport = () => {
    if (!data?.rows.length) return;
    downloadCSV(
      data.rows.map((r) => ({
        Date: r.paidOn,
        Type: r.type,
        Amount: r.amount,
        Platform: r.platform,
        Plan: r.plan,
        Subscription: r.subscriptionLabel,
        Client: r.clientName ?? "",
        PeriodStart: r.periodStart,
        PeriodEnd: r.periodEnd,
        Notes: r.notes ?? "",
      })),
      `pearfect-ledger-${new Date().toISOString().split("T")[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Pearfect Ledger
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete transaction history — payments received and platform costs.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data?.rows.length}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={filters.type ?? "all"}
            onValueChange={(v) => updateFilter("type", v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Platform</label>
          <Select
            value={filters.platformId ?? "all"}
            onValueChange={(v) => updateFilter("platformId", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Plan</label>
          <Select
            value={filters.planId ?? "all"}
            onValueChange={(v) => updateFilter("planId", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plans?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="date"
            className="w-40"
            value={filters.dateFrom ?? ""}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="date"
            className="w-40"
            value={filters.dateTo ?? ""}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
          />
        </div>

        {(filters.platformId || filters.planId || filters.dateFrom || filters.dateTo || filters.type !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({ page: 1, pageSize: 20, type: "all" })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages} · {data.totalCount} total records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))
                }
                disabled={(filters.page ?? 1) <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    page: Math.min(data.totalPages, (f.page ?? 1) + 1),
                  }))
                }
                disabled={(filters.page ?? 1) >= data.totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
