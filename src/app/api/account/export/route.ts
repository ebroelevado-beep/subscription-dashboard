import { NextResponse } from "next/server";
import { exportUserData } from "@/lib/services/account";
import { withErrorHandling } from "@/lib/api-utils";

// GET /api/account/export — Download all user data as JSON
export async function GET() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    const data = await exportUserData(userId);
    const json = JSON.stringify(data, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="subledger-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  });
}
