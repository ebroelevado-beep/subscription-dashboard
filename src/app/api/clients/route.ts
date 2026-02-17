import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations";
import { success, withErrorHandling } from "@/lib/api-utils";

// GET /api/clients — List all clients for the authenticated user
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        clientSubscriptions: {
          include: {
            subscription: {
              select: {
                id: true,
                label: true,
                status: true,
                activeUntil: true,
                plan: {
                  select: {
                    name: true,
                    platform: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    return success(clients);
  });
}

// POST /api/clients — Create a new client for the authenticated user
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();
    
    const body = await request.json();
    const data = createClientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        userId,
        name: data.name,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      },
    });
    return success(client, 201);
  });
}
