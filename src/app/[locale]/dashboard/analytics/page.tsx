"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  useAnalyticsSummary,
  useAnalyticsTrends,
  useAnalyticsClients,
  useAnalyticsBreakEven,
  useDiscipline,
  type TrendScale,
  type DisciplineFilters,
} from "@/hooks/use-analytics";
import { usePlans } from "@/hooks/use-plans";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useClients } from "@/hooks/use-clients";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/currency";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";

// ── Lazy-loaded chart components (Recharts ~350KB code-split) ──
const RevenueChart = dynamic(
  () => import("@/components/analytics/revenue-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const ClientPieChart = dynamic(
  () => import("@/components/analytics/client-pie-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


function formatPercent(val: number) {
  return `${val.toFixed(1)}%`;
}

// ── KPI Card ──
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: "emerald" | "red" | "blue" | "amber";
}) {
  const colorClasses = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("rounded-lg p-2", colorClasses[color])}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const currency = session?.user?.currency || "EUR";

  // ── Time Scale Toggle ──
  const SCALE_OPTIONS: { value: TrendScale; label: string; icon: React.ElementType }[] = [
    { value: "monthly", label: t("monthly"), icon: CalendarRange },
    { value: "weekly", label: t("weekly"), icon: CalendarDays },
    { value: "daily", label: t("daily"), icon: Calendar },
  ];

  const SCALE_DESCRIPTIONS: Record<TrendScale, string> = {
    monthly: t("last12Months"),
    weekly: t("last12Weeks"),
    daily: t("last30Days"),
  };

  // ── State ──
  const [trendScale, setTrendScale] = useState<TrendScale>("monthly");
  const [disciplineFilters, setDisciplineFilters] = useState<DisciplineFilters>({});

  // ── Data hooks ──
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends(trendScale);
  const { data: clientData, isLoading: clientsLoading } = useAnalyticsClients();
  const { data: breakEven, isLoading: breakEvenLoading } = useAnalyticsBreakEven();
  const { data: discipline, isLoading: disciplineLoading } = useDiscipline(disciplineFilters);

  // ── Filter dropdown data ──
  const { data: plans } = usePlans();
  const { data: subscriptions } = useSubscriptions();
  const { data: clients } = useClients();

  const isLoading = summaryLoading || clientsLoading || breakEvenLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Prepare pie data — top 7 + "Others"
  const pieData = (() => {
    if (!clientData?.clients.length) return [];
    const top = clientData.clients.slice(0, 7);
    const otherWeight = clientData.clients
      .slice(7)
      .reduce((s, c) => s + c.weight, 0);
    const result = top.map((c) => ({
      name: c.clientName,
      value: Math.round(c.weight * 10) / 10,
    }));
    if (otherWeight > 0) {
      result.push({
        name: "Others",
        value: Math.round(otherWeight * 10) / 10,
      });
    }
    return result;
  })();

  const hasDisciplineFilter =
    disciplineFilters.planId ||
    disciplineFilters.subscriptionId ||
    disciplineFilters.clientId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t("totalRevenue")}
          value={formatCurrency(summary?.totalRevenue ?? 0, currency)}
          subtitle={`${summary?.uniqueClientCount ?? 0} ${t("clientsLabel").toLowerCase()}`}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title={t("cogs")}
          value={formatCurrency(summary?.totalCost ?? 0, currency)}
          icon={TrendingDown}
          color="red"
        />
        <KpiCard
          title={t("netMargin")}
          value={formatCurrency(summary?.netMargin ?? 0, currency)}
          subtitle={
            summary && summary.totalRevenue > 0
              ? `${((summary.netMargin / summary.totalRevenue) * 100).toFixed(1)}% ${t("grossMargin").toLowerCase()}`
              : undefined
          }
          icon={DollarSign}
          color={(summary?.netMargin ?? 0) >= 0 ? "blue" : "red"}
        />
        <KpiCard
          title={t("arpu")}
          value={formatCurrency(summary?.arpu ?? 0, currency)}
          icon={Users}
          color="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue vs Cost Area Chart */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              {t("revenueVsCost")} — {SCALE_DESCRIPTIONS[trendScale]}
            </h2>
            <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
              {SCALE_OPTIONS.map(({ value, label, icon: ScaleIcon }) => (
                <button
                  key={value}
                  onClick={() => setTrendScale(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                    trendScale === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ScaleIcon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {trendsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : trends && trends.length > 0 ? (
            <RevenueChart data={trends} />
          ) : (
            <p className="text-muted-foreground text-sm py-16 text-center">
              {t("noDataAvailable")}
            </p>
          )}
        </div>

        {/* Client Weight Pie Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold mb-4">
            {t("topClients")}
          </h2>
          {pieData.length > 0 ? (
            <ClientPieChart data={pieData} />
          ) : (
            <p className="text-muted-foreground text-sm py-16 text-center">
              {t("noDataAvailable")}
            </p>
          )}
        </div>
      </div>

      {/* Payment Discipline — Granular */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">{t("discipline")}</h2>
            {hasDisciplineFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDisciplineFilters({})}
                className="text-xs"
              >
                {tc("clearSearch")}
              </Button>
            )}
          </div>

          {/* Discipline Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Select
              value={disciplineFilters.planId ?? "all"}
              onValueChange={(v) =>
                setDisciplineFilters((p) => ({
                  ...p,
                  planId: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={tc("allPlans")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("allPlans")}</SelectItem>
                {plans?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={disciplineFilters.subscriptionId ?? "all"}
              onValueChange={(v) =>
                setDisciplineFilters((p) => ({
                  ...p,
                  subscriptionId: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder={tc("subscriptions")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("subscriptions")}</SelectItem>
                {subscriptions?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={disciplineFilters.clientId ?? "all"}
              onValueChange={(v) =>
                setDisciplineFilters((p) => ({
                  ...p,
                  clientId: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={tc("clients")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("clients")}</SelectItem>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {disciplineLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/40">
                    <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPercent(discipline?.onTimeRate ?? 100)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("onTimeRate")} ({discipline?.onTimeCount ?? 0})
                    </p>
                  </div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/40">
                    <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPercent(100 - (discipline?.onTimeRate ?? 100))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("latePayments")} ({discipline?.lateCount ?? 0})
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual bar */}
              <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${discipline?.onTimeRate ?? 100}%` }}
                />
              </div>

              {/* Avg Days Late */}
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <Clock className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t("avgDaysLate")}:{" "}
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        (discipline?.avgDaysLate ?? 0) > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {discipline?.avgDaysLate ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* LTV Top Clients */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold mb-4">
            {t("topClients")} — Top 10
          </h2>
          {clientData && clientData.clients.length > 0 ? (
            <div className="space-y-2">
              {clientData.clients.slice(0, 10).map((c, idx) => (
                <div
                  key={c.clientId}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tabular-nums text-muted-foreground w-5">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-sm">{c.clientName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm tabular-nums">
                      {formatCurrency(c.totalPaid, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {t("noDataAvailable")}
            </p>
          )}
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">
          {t("breakEvenAnalysis")}
        </h2>
        {breakEven && breakEven.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {breakEven.map((sub) => (
              <div
                key={sub.subscriptionId}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  sub.profitable
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{sub.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.platform} · {sub.plan}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      sub.profitable
                        ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300"
                    )}
                  >
                    {sub.profitable ? "✓" : "✗"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("revenueLabel")}</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(sub.revenue, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("costLabel")}</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
                      {formatCurrency(sub.cost, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("profitLabel")}</p>
                    <p
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        sub.net >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {formatCurrency(sub.net, currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">
            {t("noDataAvailable")}
          </p>
        )}
      </div>
    </div>
  );
}
