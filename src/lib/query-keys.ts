/**
 * Centralized query-key factory.
 * Keeps keys co-located → type-safe invalidation across hooks.
 */
export const queryKeys = {
  // ── CRUD entities ──
  dashboardStats: ["dashboard-stats"] as const,

  platforms: ["platforms"] as const,

  plans: (platformId?: string) => ["plans", platformId ?? "all"] as const,
  allPlans: ["plans"] as const,

  subscriptions: (planId?: string) =>
    ["subscriptions", planId ?? "all"] as const,
  subscription: (id: string) => ["subscriptions", id] as const,
  allSubscriptions: ["subscriptions"] as const,

  clients: ["clients"] as const,
  client: (id: string) => ["clients", id] as const,

  // ── Analytics ──
  analyticsSummary: ["analytics-summary"] as const,
  analyticsHistory: (filters: object) =>
    ["analytics-history", filters] as const,
  analyticsTrends: (scale: string) => ["analytics-trends", scale] as const,
  analyticsClients: ["analytics-clients"] as const,
  analyticsBreakEven: ["analytics-break-even"] as const,
  analyticsDiscipline: (filters: object) =>
    ["analytics-discipline", filters] as const,
} as const;
