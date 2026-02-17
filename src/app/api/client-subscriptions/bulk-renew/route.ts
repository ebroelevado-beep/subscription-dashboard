import { type NextRequest } from "next/server";
import { renewBulkClientSubscriptionsSchema } from "@/lib/validations";
import { renewBulkClientSubscriptions } from "@/lib/services/renewals";
import { success, withErrorHandling } from "@/lib/api-utils";

// POST /api/client-subscriptions/bulk-renew — Renew multiple seats at once
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const data = renewBulkClientSubscriptionsSchema.parse(body);

    const result = await renewBulkClientSubscriptions({
      items: data.items,
      months: data.months,
    });

    return success(result, 201);
  });
}
