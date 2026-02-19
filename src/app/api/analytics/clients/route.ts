import { prisma } from "@/lib/prisma";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/analytics/clients — Client LTV ranking + revenue weight
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    // Use groupBy with _sum instead of loading all rows and reducing in memory
    const grouped = await prisma.renewalLog.groupBy({
      by: ["clientSubscriptionId"],
      _sum: { amountPaid: true },
      _count: true,
      where: { clientSubscription: { subscription: { userId } } },
    });

    // Fetch client names for the grouped results
    const csIds = grouped
      .map((g) => g.clientSubscriptionId)
      .filter((id): id is string => id !== null);
    const seats = await prisma.clientSubscription.findMany({
      where: { id: { in: csIds } },
      select: {
        id: true,
        clientId: true,
        client: { select: { name: true } },
      },
    });

    const seatMap = new Map(seats.map((s) => [s.id, s]));

    // Aggregate by client (a client can have multiple seats)
    const clientMap = new Map<
      string,
      { clientId: string; clientName: string; totalPaid: number; renewalCount: number }
    >();

    for (const g of grouped) {
      if (!g.clientSubscriptionId) continue;
      const seat = seatMap.get(g.clientSubscriptionId);
      if (!seat) continue;

      const amount = Number(g._sum.amountPaid ?? 0);
      const existing = clientMap.get(seat.clientId);

      if (existing) {
        existing.totalPaid += amount;
        existing.renewalCount += g._count;
      } else {
        clientMap.set(seat.clientId, {
          clientId: seat.clientId,
          clientName: seat.client.name,
          totalPaid: amount,
          renewalCount: g._count,
        });
      }
    }

    const totalRevenue = [...clientMap.values()].reduce(
      (sum, c) => sum + c.totalPaid,
      0,
    );

    // Sort by totalPaid descending and compute weight percentage
    const clients = [...clientMap.values()]
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .map((c) => ({
        ...c,
        weight: totalRevenue > 0 ? (c.totalPaid / totalRevenue) * 100 : 0,
      }));

    return success({ clients, totalRevenue });
  });
}
