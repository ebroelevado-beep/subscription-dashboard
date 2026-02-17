import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlatformSchema } from "@/lib/validations";
import { success, error, withErrorHandling } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/platforms/[id] — Get one platform with its plans
export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;
    
    const platform = await prisma.platform.findUnique({
      where: { id, userId },
      include: {
        plans: {
          include: {
            subscriptions: {
              select: {
                id: true,
                label: true,
                status: true,
                activeUntil: true,
              },
            },
          },
        },
      },
    });

    if (!platform) return error("Platform not found", 404);
    return success(platform);
  });
}

// PATCH /api/platforms/[id] — Update a platform
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json();
    const data = createPlatformSchema.partial().parse(body);

    const platform = await prisma.platform.update({ 
      where: { id, userId }, 
      data 
    });
    return success(platform);
  });
}

// DELETE /api/platforms/[id] — Delete a platform
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    const { id } = await params;
    
    await prisma.platform.delete({ where: { id, userId } });
    return success({ deleted: true });
  });
}
