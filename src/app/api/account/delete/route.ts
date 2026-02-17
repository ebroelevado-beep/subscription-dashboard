import { deleteUserAccount } from "@/lib/services/account";
import { success, withErrorHandling } from "@/lib/api-utils";

// DELETE /api/account/delete — Permanently delete user + all data
export async function DELETE() {
  return withErrorHandling(async () => {
    const { getAuthUserId } = await import("@/lib/auth-utils");
    const userId = await getAuthUserId();

    await deleteUserAccount(userId);

    return success({ message: "Account deleted" });
  });
}
