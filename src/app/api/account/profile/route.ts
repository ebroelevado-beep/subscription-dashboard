import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/account";
import { success, withErrorHandling } from "@/lib/api-utils";

// PATCH /api/account/profile — Update display name / avatar
export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      },
      select: { id: true, name: true, email: true, image: true },
    });

    return success(user);
  });
}
