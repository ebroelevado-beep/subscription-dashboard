import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";
import { startOfMonth, subMonths } from "date-fns";

interface RevenueRow {
  platformId: string;
  platform: string;
  revenue: number;
}

interface CostRow {
  platformId: string;
  cost: number;
}

// GET /api/analytics/platform-contribution — Platform contribution over the last 12 months (monthly window)
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const fromDate = startOfMonth(subMonths(new Date(), 11));

    const [platforms, revenueRows, costRows] = await Promise.all([
      prisma.platform.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.$queryRaw<RevenueRow[]>`
        SELECT
          p.id AS "platformId",
          p.name AS "platform",
          COALESCE(SUM(rl.amount_paid), 0)::float AS revenue
        FROM platforms p
        LEFT JOIN plans pl ON pl.platform_id = p.id
        LEFT JOIN subscriptions s ON s.plan_id = pl.id
        LEFT JOIN client_subscriptions cs ON cs.subscription_id = s.id
        LEFT JOIN renewal_logs rl
          ON rl.client_subscription_id = cs.id
         AND rl.paid_on >= ${fromDate}
        WHERE p.user_id = ${userId}
        GROUP BY p.id, p.name
      `,
      prisma.$queryRaw<CostRow[]>`
        SELECT
          p.id AS "platformId",
          COALESCE(SUM(pr.amount_paid), 0)::float AS cost
        FROM platforms p
        LEFT JOIN plans pl ON pl.platform_id = p.id
        LEFT JOIN subscriptions s ON s.plan_id = pl.id
        LEFT JOIN platform_renewals pr
          ON pr.subscription_id = s.id
         AND pr.paid_on >= ${fromDate}
        WHERE p.user_id = ${userId}
        GROUP BY p.id
      `,
    ]);

    const revenueMap = new Map(revenueRows.map((r) => [r.platformId, Number(r.revenue || 0)]));
    const costMap = new Map(costRows.map((c) => [c.platformId, Number(c.cost || 0)]));

    const rows = platforms.map((platform) => {
      const revenue = revenueMap.get(platform.id) ?? 0;
      const cost = costMap.get(platform.id) ?? 0;
      const net = revenue - cost;

      return {
        platformId: platform.id,
        platform: platform.name,
        revenue,
        cost,
        net,
      };
    });

    rows.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    return success({
      from: fromDate,
      to: new Date(),
      rows,
    });
  });
}
