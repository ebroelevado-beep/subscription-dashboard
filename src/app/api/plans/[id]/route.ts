import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlanSchema } from "@/lib/validations";
import { success, error, withErrorHandling } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/plans/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id, userId },
      include: {
        platform: { select: { id: true, name: true } },
        subscriptions: {
          select: {
            id: true,
            label: true,
            status: true,
            activeUntil: true,
            _count: { select: { clientSubscriptions: true } },
          },
        },
      },
    });

    if (!plan) return error("Plan not found", 404);
    return success(plan);
  });
}

// PATCH /api/plans/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json();
    const data = createPlanSchema.partial().parse(body);

    const plan = await prisma.plan.update({
      where: { id, userId },
      data,
    });
    return success(plan);
  });
}

// DELETE /api/plans/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;

    await prisma.plan.delete({ where: { id, userId } });
    return success({ deleted: true });
  });
}
