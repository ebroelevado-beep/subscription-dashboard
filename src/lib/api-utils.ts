import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard JSON success response
 */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Standard JSON error response
 */
export function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Wraps an async route handler with try/catch and Zod error formatting
 */
export async function withErrorHandling(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => `${(e.path as (string | number)[]).join(".")}: ${e.message as string}`
      );
      return error(`Validation error: ${messages.join(", ")}`, 422);
    }

    if (err instanceof Error) {
      // Prisma "not found" errors
      if (err.name === "NotFoundError" || err.message.includes("No")) {
        return error(err.message, 404);
      }
      return error(err.message, 500);
    }

    return error("Unknown error", 500);
  }
}
