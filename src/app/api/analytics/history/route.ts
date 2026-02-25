import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";
import { NextRequest } from "next/server";

interface UnifiedRow {
  id: string;
  type: "income" | "cost";
  amount: number;
  paidOn: string;
  periodStart: string;
  periodEnd: string;
  platform: string;
  plan: string;
  subscriptionLabel: string;
  subscriptionId: string;
  clientName: string | null;
  notes: string | null;
}

// GET /api/analytics/history — Paginated unified transaction ledger
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20)));
    const type = params.get("type") ?? "all"; // income | cost | all
    const platformId = params.get("platformId") ?? undefined;
    const planId = params.get("planId") ?? undefined;
    const subscriptionId = params.get("subscriptionId") ?? undefined;
    const clientId = params.get("clientId") ?? undefined;
    const dateFrom = params.get("dateFrom") ?? undefined;
    const dateTo = params.get("dateTo") ?? undefined;

    // --- Build shared date filter ---
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    const hasDates = Object.keys(dateFilter).length > 0;

    // --- Income rows ---
    let incomeRows: UnifiedRow[] = [];
    let incomeCount = 0;

    if (type === "all" || type === "income") {
      const where = {
        clientSubscription: {
          subscription: {
            userId,
            ...(subscriptionId ? { id: subscriptionId } : {}),
            ...(planId ? { planId } : {}),
            ...(platformId ? { plan: { platformId } } : {}),
          },
          ...(clientId ? { clientId } : {}),
        },
        ...(hasDates ? { paidOn: dateFilter } : {}),
      };

      const [logs, count] = await Promise.all([
        prisma.renewalLog.findMany({
          where,
          include: {
            clientSubscription: {
              include: {
                client: { select: { name: true } },
                subscription: {
                  include: {
                    plan: {
                      include: { platform: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
          orderBy: { paidOn: "desc" },
        }),
        prisma.renewalLog.count({ where }),
      ]);

      incomeRows = logs.map((l) => ({
        id: l.id,
        type: "income" as const,
        amount: Number(l.amountPaid),
        paidOn: l.paidOn.toISOString().split("T")[0],
        periodStart: l.periodStart.toISOString().split("T")[0],
        periodEnd: l.periodEnd.toISOString().split("T")[0],
        platform: l.clientSubscription?.subscription.plan.platform.name ?? "Deleted",
        plan: l.clientSubscription?.subscription.plan.name ?? "Deleted",
        subscriptionLabel: l.clientSubscription?.subscription.label ?? "Deleted",
        subscriptionId: l.clientSubscription?.subscription.id ?? "deleted",
        clientName: l.clientSubscription?.client.name ?? "Deleted Client",
        notes: l.notes,
      }));
      incomeCount = count;
    }

    // --- Cost rows ---
    let costRows: UnifiedRow[] = [];
    let costCount = 0;

    if ((type === "all" || type === "cost") && !clientId) {
      // Cost rows don't have clientId — skip if filtering by client
      const where = {
        subscription: {
          userId,
          ...(subscriptionId ? { id: subscriptionId } : {}),
          ...(planId ? { planId } : {}),
          ...(platformId ? { plan: { platformId } } : {}),
        },
        ...(hasDates ? { paidOn: dateFilter } : {}),
      };

      const [renewals, count] = await Promise.all([
        prisma.platformRenewal.findMany({
          where,
          include: {
            subscription: {
              include: {
                plan: {
                  include: { platform: { select: { name: true } } },
                },
              },
            },
          },
          orderBy: { paidOn: "desc" },
        }),
        prisma.platformRenewal.count({ where }),
      ]);

      costRows = renewals.map((r) => ({
        id: r.id,
        type: "cost" as const,
        amount: Number(r.amountPaid),
        paidOn: r.paidOn.toISOString().split("T")[0],
        periodStart: r.periodStart.toISOString().split("T")[0],
        periodEnd: r.periodEnd.toISOString().split("T")[0],
        platform: r.subscription.plan.platform.name,
        plan: r.subscription.plan.name,
        subscriptionLabel: r.subscription.label,
        subscriptionId: r.subscription.id,
        clientName: r.subscription.label,
        notes: "platform_payment",
      }));
      costCount = count;
    }

    // --- Merge + sort + paginate ---
    const allRows = [...incomeRows, ...costRows].sort(
      (a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime()
    );

    const totalCount = type === "income" ? incomeCount
      : type === "cost" ? costCount
      : incomeCount + costCount;

    const start = (page - 1) * pageSize;
    const rows = allRows.slice(start, start + pageSize);

    return success({
      rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  });
}
