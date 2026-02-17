import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";
import { NextRequest } from "next/server";

// GET /api/analytics/discipline — Granular payment discipline analysis
// Supports optional filters: planId, subscriptionId, clientId
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const url = new URL(req.url);
    const planId = url.searchParams.get("planId") ?? undefined;
    const subscriptionId = url.searchParams.get("subscriptionId") ?? undefined;
    const clientId = url.searchParams.get("clientId") ?? undefined;

    // Build dynamic where clause — all filters stack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      clientSubscription: {
        subscription: { userId },
      },
    };

    if (subscriptionId) {
      where.clientSubscription.subscriptionId = subscriptionId;
    }
    if (planId) {
      where.clientSubscription = {
        ...where.clientSubscription,
        subscription: {
          ...where.clientSubscription.subscription,
          planId,
        },
      };
    }
    if (clientId) {
      where.clientSubscription.clientId = clientId;
    }

    const renewalLogs = await prisma.renewalLog.findMany({
      where,
      select: { paidOn: true, dueOn: true },
    });

    const totalPayments = renewalLogs.length;

    if (totalPayments === 0) {
      return success({
        totalPayments: 0,
        onTimeCount: 0,
        lateCount: 0,
        onTimeRate: 100,
        avgDaysLate: 0,
      });
    }

    let onTimeCount = 0;
    let totalDaysLate = 0;
    let lateCount = 0;

    for (const log of renewalLogs) {
      const paidDate = new Date(log.paidOn);
      const dueDate = new Date(log.dueOn);
      const diffMs = paidDate.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        onTimeCount++;
      } else {
        lateCount++;
        totalDaysLate += diffDays;
      }
    }

    const onTimeRate = (onTimeCount / totalPayments) * 100;
    const avgDaysLate = lateCount > 0 ? totalDaysLate / lateCount : 0;

    return success({
      totalPayments,
      onTimeCount,
      lateCount,
      onTimeRate,
      avgDaysLate: Math.round(avgDaysLate * 10) / 10,
    });
  });
}
