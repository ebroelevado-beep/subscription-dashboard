import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";
import { startOfDay, addDays, startOfMonth, endOfMonth } from "date-fns";

// GET /api/dashboard/stats — Aggregated overview scoped to current user
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const today = startOfDay(new Date());
    const soonThreshold = addDays(today, 3);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Run all counts in parallel — use aggregates where possible
    const [
      platformCount,
      activePlanCount,
      clientCount,
      activeSubscriptionCount,
      monthlyCostAgg,
      allActiveSeats,
      thisMonthRevenueAgg,
      thisMonthCostAgg,
    ] = await Promise.all([
      prisma.platform.count({ where: { userId } }),
      prisma.plan.count({ where: { userId, isActive: true } }),
      prisma.client.count({ where: { userId } }),
      // Count only — no need to load full rows
      prisma.subscription.count({
        where: { userId, status: "active" },
      }),
      // SUM plan.cost for active subscriptions (replaces findMany + reduce)
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(p.cost), 0)::float AS total
        FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.user_id = ${userId} AND s.status = 'active'
      `,
      // Active seats — still need full rows for overdue/expiring display
      prisma.clientSubscription.findMany({
        where: {
          status: "active",
          subscription: { userId },
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true },
          },
          subscription: {
            include: {
              plan: {
                include: {
                  platform: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { activeUntil: "asc" },
      }),
      // This month revenue — aggregate instead of findMany + reduce
      prisma.renewalLog.aggregate({
        _sum: { amountPaid: true },
        where: {
          paidOn: { gte: monthStart, lte: monthEnd },
          clientSubscription: { subscription: { userId } },
        },
      }),
      // This month cost — aggregate instead of findMany + reduce
      prisma.platformRenewal.aggregate({
        _sum: { amountPaid: true },
        where: {
          paidOn: { gte: monthStart, lte: monthEnd },
          subscription: { userId },
        },
      }),
    ]);

    // Financials from aggregates (no more in-memory reduce)
    const monthlyCost = monthlyCostAgg[0]?.total ?? 0;
    const monthlyRevenue = allActiveSeats.reduce(
      (sum, s) => sum + Number(s.customPrice),
      0,
    );
    const thisMonthRevenue = Number(thisMonthRevenueAgg._sum.amountPaid ?? 0);
    const thisMonthCost = Number(thisMonthCostAgg._sum.amountPaid ?? 0);

    // Build overdue + expiring-soon lists
    const overdueSeats = allActiveSeats
      .filter((s) => new Date(s.activeUntil) < today)
      .map((s) => ({
        id: s.id,
        clientId: s.client.id,
        clientName: s.client.name,
        clientPhone: s.client.phone,
        customPrice: Number(s.customPrice),
        activeUntil: s.activeUntil,
        daysOverdue: Math.floor(
          (today.getTime() - new Date(s.activeUntil).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        platform: s.subscription.plan.platform.name,
        plan: s.subscription.plan.name,
        subscriptionLabel: s.subscription.label,
        subscriptionId: s.subscription.id,
      }));

    const expiringSoonSeats = allActiveSeats
      .filter(
        (s) =>
          new Date(s.activeUntil) >= today &&
          new Date(s.activeUntil) <= soonThreshold,
      )
      .map((s) => ({
        id: s.id,
        clientId: s.client.id,
        clientName: s.client.name,
        customPrice: Number(s.customPrice),
        activeUntil: s.activeUntil,
        daysLeft: Math.ceil(
          (new Date(s.activeUntil).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        platform: s.subscription.plan.platform.name,
        subscriptionLabel: s.subscription.label,
        subscriptionId: s.subscription.id,
      }));

    return success({
      platformCount,
      activePlanCount,
      clientCount,
      activeSubscriptionCount,
      activeSeatCount: allActiveSeats.length,
      monthlyCost,
      monthlyRevenue,
      profit: monthlyRevenue - monthlyCost,
      thisMonthRevenue,
      thisMonthCost,
      thisMonthProfit: thisMonthRevenue - thisMonthCost,
      overdueSeats,
      expiringSoonSeats,
    });
  });
}
