"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/fetch-api";
import { queryKeys } from "@/lib/query-keys";

export interface OverdueSeat {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  customPrice: number;
  activeUntil: string;
  daysOverdue: number;
  platform: string;
  plan: string;
  subscriptionLabel: string;
  subscriptionId: string;
}

export interface ExpiringSoonSeat {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  customPrice: number;
  activeUntil: string;
  daysLeft: number;
  platform: string;
  subscriptionLabel: string;
  subscriptionId: string;
}

export interface DashboardStats {
  platformCount: number;
  activePlanCount: number;
  clientCount: number;
  activeSubscriptionCount: number;
  activeSeatCount: number;
  monthlyCost: number;
  monthlyRevenue: number;
  profit: number;
  thisMonthRevenue: number;
  thisMonthCost: number;
  thisMonthProfit: number;
  overdueSeats: OverdueSeat[];
  expiringSoonSeats: ExpiringSoonSeat[];
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => fetchApi<DashboardStats>("/api/dashboard/stats"),
    refetchInterval: 60_000,
  });
}
