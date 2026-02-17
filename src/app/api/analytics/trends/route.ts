import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";
import {
  subMonths,
  subWeeks,
  subDays,
  startOfMonth,
  startOfWeek,
  startOfDay,
  format,
} from "date-fns";
import { NextRequest } from "next/server";

type Scale = "monthly" | "weekly" | "daily";

interface Bucket {
  period: string;
  revenue: number;
  cost: number;
}

function buildBuckets(scale: Scale, now: Date): Bucket[] {
  const buckets: Bucket[] = [];

  switch (scale) {
    case "monthly":
      for (let i = 11; i >= 0; i--) {
        const m = startOfMonth(subMonths(now, i));
        buckets.push({ period: format(m, "yyyy-MM"), revenue: 0, cost: 0 });
      }
      break;
    case "weekly":
      for (let i = 11; i >= 0; i--) {
        const w = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        buckets.push({
          period: format(w, "yyyy-'W'II"),
          revenue: 0,
          cost: 0,
        });
      }
      break;
    case "daily":
      for (let i = 29; i >= 0; i--) {
        const d = startOfDay(subDays(now, i));
        buckets.push({ period: format(d, "yyyy-MM-dd"), revenue: 0, cost: 0 });
      }
      break;
  }

  return buckets;
}

function dateToKey(date: Date, scale: Scale): string {
  switch (scale) {
    case "monthly":
      return format(date, "yyyy-MM");
    case "weekly":
      return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-'W'II");
    case "daily":
      return format(date, "yyyy-MM-dd");
  }
}

function getLookbackDate(scale: Scale, now: Date): Date {
  switch (scale) {
    case "monthly":
      return startOfMonth(subMonths(now, 11));
    case "weekly":
      return startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
    case "daily":
      return startOfDay(subDays(now, 29));
  }
}

const VALID_SCALES: Scale[] = ["monthly", "weekly", "daily"];

// GET /api/analytics/trends — Revenue vs Cost with dynamic time-scale
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const url = new URL(req.url);
    const rawScale = url.searchParams.get("scale") ?? "monthly";
    const scale: Scale = VALID_SCALES.includes(rawScale as Scale)
      ? (rawScale as Scale)
      : "monthly";

    const now = new Date();
    const lookbackDate = getLookbackDate(scale, now);

    const [renewalLogs, platformRenewals] = await Promise.all([
      prisma.renewalLog.findMany({
        where: {
          paidOn: { gte: lookbackDate },
          clientSubscription: { subscription: { userId } },
        },
        select: { amountPaid: true, paidOn: true },
      }),
      prisma.platformRenewal.findMany({
        where: {
          paidOn: { gte: lookbackDate },
          subscription: { userId },
        },
        select: { amountPaid: true, paidOn: true },
      }),
    ]);

    const buckets = buildBuckets(scale, now);
    const bucketMap = new Map(buckets.map((b) => [b.period, b]));

    for (const log of renewalLogs) {
      const key = dateToKey(new Date(log.paidOn), scale);
      const bucket = bucketMap.get(key);
      if (bucket) bucket.revenue += Number(log.amountPaid);
    }

    for (const pr of platformRenewals) {
      const key = dateToKey(new Date(pr.paidOn), scale);
      const bucket = bucketMap.get(key);
      if (bucket) bucket.cost += Number(pr.amountPaid);
    }

    return success(buckets);
  });
}
