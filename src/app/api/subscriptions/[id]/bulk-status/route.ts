import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, success, error } from "@/lib/api-utils";
import { differenceInDays, addDays, startOfDay } from "date-fns";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const bulkStatusSchema = z.object({
  action: z.enum(["pause", "resume"]),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json();
    const { action } = bulkStatusSchema.parse(body);

    // Verify subscription belongs to user
    const sub = await prisma.subscription.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!sub) return error("Subscription not found", 404);

    const today = startOfDay(new Date());

    if (action === "pause") {
      // First get all active seats to calculate individual remaining days
      const activeSeats = await prisma.clientSubscription.findMany({
        where: { subscriptionId: id, status: "active" },
        select: { id: true, activeUntil: true },
      });

      // Update each seat individually to store its own remaining days
      let count = 0;
      for (const seat of activeSeats) {
        const expiry = startOfDay(new Date(seat.activeUntil));
        const remaining = Math.max(0, differenceInDays(expiry, today));
        await prisma.clientSubscription.update({
          where: { id: seat.id },
          data: {
            status: "paused",
            leftAt: today,
            remainingDays: remaining,
          },
        });
        count++;
      }
      return success({ updated: count, action: "paused" });
    }

    // Resume all paused seats — restore their individual remaining days
    const pausedSeats = await prisma.clientSubscription.findMany({
      where: { subscriptionId: id, status: "paused" },
      select: { id: true, remainingDays: true },
    });

    let count = 0;
    for (const seat of pausedSeats) {
      const days = seat.remainingDays ?? 0;
      await prisma.clientSubscription.update({
        where: { id: seat.id },
        data: {
          status: "active",
          leftAt: null,
          activeUntil: days > 0 ? addDays(today, days) : today,
          remainingDays: null,
        },
      });
      count++;
    }
    return success({ updated: count, action: "resumed" });
  });
}
