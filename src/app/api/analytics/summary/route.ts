import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/analytics/summary — Core KPIs scoped to the current user
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const userScope = { clientSubscription: { subscription: { userId } } };
    const costScope = { subscription: { userId } };

    const [revenueAgg, costAgg, uniqueClients, totalPayments, onTimeCount] =
      await Promise.all([
        // Total revenue — aggregate instead of findMany + reduce
        prisma.renewalLog.aggregate({
          _sum: { amountPaid: true },
          where: userScope,
        }),
        // Total cost — aggregate instead of findMany + reduce
        prisma.platformRenewal.aggregate({
          _sum: { amountPaid: true },
          where: costScope,
        }),
        // Unique paying clients
        prisma.clientSubscription.findMany({
          where: { subscription: { userId }, renewalLogs: { some: {} } },
          select: { clientId: true },
          distinct: ["clientId"],
        }),
        // Total payment count — count instead of findMany.length
        prisma.renewalLog.count({ where: userScope }),
        // On-time payment count — count with WHERE instead of filter
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint AS count
          FROM renewal_logs rl
          JOIN client_subscriptions cs ON cs.id = rl.client_subscription_id
          JOIN subscriptions s ON s.id = cs.subscription_id
          WHERE s.user_id = ${userId}
            AND rl.paid_on <= rl.due_on
        `,
      ]);

    const totalRevenue = Number(revenueAgg._sum.amountPaid ?? 0);
    const totalCost = Number(costAgg._sum.amountPaid ?? 0);
    const netMargin = totalRevenue - totalCost;
    const uniqueClientCount = uniqueClients.length;
    const arpu = uniqueClientCount > 0 ? totalRevenue / uniqueClientCount : 0;

    const onTimeCountNum = Number(onTimeCount[0]?.count ?? 0);
    const onTimeRate =
      totalPayments > 0 ? (onTimeCountNum / totalPayments) * 100 : 100;

    return success({
      totalRevenue,
      totalCost,
      netMargin,
      arpu,
      onTimeRate,
      totalPayments,
      onTimeCount: onTimeCountNum,
      lateCount: totalPayments - onTimeCountNum,
      uniqueClientCount,
    });
  });
}
