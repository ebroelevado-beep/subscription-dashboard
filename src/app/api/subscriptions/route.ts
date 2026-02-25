import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubscriptionSchema } from "@/lib/validations";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/subscriptions — List all subscriptions for the authenticated user (optionally filtered by planId)
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        ...(planId && { planId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            cost: true,
            maxSeats: true,
            platform: { select: { id: true, name: true } },
          },
        },
        clientSubscriptions: {
          where: { status: "active" },
          select: { id: true, customPrice: true, status: true },
        },
      },
    });
    return success(subscriptions);
  });
}

// POST /api/subscriptions — Create a new subscription for the authenticated user
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { addMonths } = await import("date-fns");

    const body = await request.json();
    const data = createSubscriptionSchema.parse(body);

    const activeUntil = addMonths(data.startDate, data.durationMonths);

    const subscription = await prisma.subscription.create({
      data: {
        label: data.label,
        startDate: data.startDate,
        activeUntil,
        status: data.status,
        masterUsername: data.masterUsername,
        masterPassword: data.masterPassword,
        isAutopayable: data.isAutopayable,
        user: { connect: { id: userId } },
        plan: { connect: { id: data.planId } },
        ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
      },
    });
    return success(subscription, 201);
  });
}
