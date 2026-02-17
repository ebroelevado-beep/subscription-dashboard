import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlatformSchema } from "@/lib/validations";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/platforms — List all platforms for the authenticated user
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const platforms = await prisma.platform.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        plans: {
          select: { id: true, name: true, cost: true, maxSeats: true, isActive: true },
        },
      },
    });
    return success(platforms);
  });
}


// POST /api/platforms — Create a new platform for the authenticated user
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const body = await request.json();
    const data = createPlatformSchema.parse(body);

    const platform = await prisma.platform.create({ 
      data: { ...data, userId } 
    });
    return success(platform, 201);
  });
}

