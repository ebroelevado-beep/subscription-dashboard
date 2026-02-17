import { type NextRequest } from "next/server";
import { importUserData } from "@/lib/services/account";
import { importDataSchema } from "@/lib/validations/account";
import { success, withErrorHandling } from "@/lib/api-utils";

// POST /api/account/import — Import data from a JSON backup
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const body = await request.json();
    const data = importDataSchema.parse(body);

    await importUserData(userId, data);

    return success({ message: "Data imported successfully" }, 201);
  });
}
