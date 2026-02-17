import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/analytics/break-even — Subscription-group profitability
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: {
          include: { platform: { select: { name: true } } },
        },
        clientSubscriptions: {
          include: {
            renewalLogs: { select: { amountPaid: true } },
          },
        },
        platformRenewals: { select: { amountPaid: true } },
      },
    });

    type Sub = (typeof subscriptions)[number];
    const result = subscriptions.map((sub: Sub) => {
      const revenue = sub.clientSubscriptions.reduce(
        (sum, cs) =>
          sum +
          cs.renewalLogs.reduce((s, r) => s + Number(r.amountPaid), 0),
        0
      );
      const cost = sub.platformRenewals.reduce(
        (sum, pr) => sum + Number(pr.amountPaid),
        0
      );
      const net = revenue - cost;

      return {
        subscriptionId: sub.id,
        label: sub.label,
        platform: sub.plan.platform.name,
        plan: sub.plan.name,
        revenue,
        cost,
        net,
        profitable: net >= 0,
        activeSeats: sub.clientSubscriptions.filter(
          (cs) => cs.status === "active"
        ).length,
      };
    });

    // Sort: unprofitable first, then by net ascending
    result.sort((a, b) => {
      if (a.profitable !== b.profitable) return a.profitable ? 1 : -1;
      return a.net - b.net;
    });

    return success(result);
  });
}
