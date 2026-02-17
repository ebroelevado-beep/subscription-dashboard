"use client";

import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  LayoutGrid,
  Layers,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold ${
            trend === "up"
              ? "text-green-600 dark:text-green-400"
              : trend === "down"
              ? "text-red-600 dark:text-red-400"
              : ""
          }`}
        >
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Business overview at a glance</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className={`animate-fade-in delay-${i + 1}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="size-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const profit = stats.profit;
  const profitTrend = profit >= 0 ? "up" : "down";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Business overview at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in delay-1">
        <StatCard
          title="Platforms"
          value={stats.platformCount}
          icon={LayoutGrid}
          description={`${stats.activePlanCount} active plans`}
        />
        </div>
        <div className="animate-fade-in delay-2">
        <StatCard
          title="Clients"
          value={stats.clientCount}
          icon={Users}
          description={`${stats.activeSeatCount} active seats`}
        />
        </div>
        <div className="animate-fade-in delay-3">
        <StatCard
          title="Subscriptions"
          value={stats.activeSubscriptionCount}
          icon={Layers}
          description="Active subscriptions"
        />
        </div>
        <div className="animate-fade-in delay-4">
        <StatCard
          title="Active Seats"
          value={stats.activeSeatCount}
          icon={CreditCard}
          description="Across all subscriptions"
        />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
          trend="up"
          description="Total from active seats"
        />
        <StatCard
          title="Monthly Cost"
          value={formatCurrency(stats.monthlyCost)}
          icon={CreditCard}
          description="Total subscription costs"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(profit)}
          icon={profit >= 0 ? TrendingUp : TrendingDown}
          trend={profitTrend}
          description={
            stats.monthlyRevenue > 0
              ? `${((profit / stats.monthlyRevenue) * 100).toFixed(0)}% margin`
              : "No revenue yet"
          }
        />
      </div>

      {/* Financial Health — This Month Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-emerald-500" />
            Financial Health — This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.thisMonthRevenue ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From client renewals
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost</p>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(stats.thisMonthCost ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Platform renewals paid
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net</p>
              <p className={`mt-1 text-2xl font-bold ${(stats.thisMonthProfit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(stats.thisMonthProfit ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Actual cash flow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue & Expiring Soon */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Seats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Overdue Seats
            </CardTitle>
            {stats.overdueSeats.length > 0 && (
              <Badge variant="destructive">{stats.overdueSeats.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {stats.overdueSeats.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">🎉 No overdue seats!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All clients are up to date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.overdueSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-3 py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {seat.clientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {seat.platform} · {seat.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {seat.daysOverdue}d overdue
                      </Badge>
                      <Button asChild variant="ghost" size="icon" className="size-7">
                        <Link href={`/dashboard/subscriptions/${seat.subscriptionId}`}>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-yellow-500" />
              Expiring Soon
            </CardTitle>
            {stats.expiringSoonSeats.length > 0 && (
              <Badge variant="secondary">{stats.expiringSoonSeats.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {stats.expiringSoonSeats.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">
                  No seats expiring in the next 3 days.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.expiringSoonSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-950/20 px-3 py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {seat.clientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {seat.platform} · {seat.subscriptionLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {seat.daysLeft === 0
                          ? "Today!"
                          : `${seat.daysLeft}d left`}
                      </Badge>
                      <Button asChild variant="ghost" size="icon" className="size-7">
                        <Link href={`/dashboard/subscriptions/${seat.subscriptionId}`}>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/platforms">Manage Platforms</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/subscriptions">View Subscriptions</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/clients">View Clients</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Data refreshes automatically every 60 seconds · Last fetch{" "}
        {formatDistanceToNow(new Date(), { addSuffix: true })}
      </p>
    </div>
  );
}
