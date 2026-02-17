import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user's ID from the session.
 * Returns the userId string if authenticated, or throws an error response.
 */
export async function getAuthUserId(): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return session.user.id;
}
