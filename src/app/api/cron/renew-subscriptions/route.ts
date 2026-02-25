import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfDay } from "date-fns";

export async function GET() {
  try {
    const today = startOfDay(new Date());

    // 1. Find subscriptions that are autopayable and have expired
    const subscriptionsToRenew = await prisma.subscription.findMany({
      where: {
        isAutopayable: true,
        activeUntil: {
          lte: today,
        },
        status: "active",
      },
      include: {
        plan: true,
      },
    });

    const results = [];

    for (const sub of subscriptionsToRenew) {
      const nextExpiry = addMonths(new Date(sub.activeUntil), 1);

      // Perform renewal in a transaction
      const renewal = await prisma.$transaction(async (tx) => {
        // Create PlatformRenewal record (this feeds history and analytics)
        const pRenewal = await tx.platformRenewal.create({
          data: {
            subscriptionId: sub.id,
            amountPaid: sub.plan.cost,
            periodStart: sub.activeUntil,
            periodEnd: nextExpiry,
            paidOn: today,
          },
        });

        // Update Subscription expiry
        await tx.subscription.update({
          where: { id: sub.id },
          data: { activeUntil: nextExpiry },
        });

        return pRenewal;
      });

      results.push({
        id: sub.id,
        label: sub.label,
        newExpiry: nextExpiry,
        renewalId: renewal.id,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      renewals: results,
    });
  } catch (err: any) {
    console.error("[CRON RENEWAL ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
