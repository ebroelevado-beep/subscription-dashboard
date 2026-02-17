import { type NextRequest } from "next/server";
import { renewClientSubscriptionSchema } from "@/lib/validations";
import { renewClientSubscription } from "@/lib/services/renewals";
import { success, withErrorHandling } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/client-subscriptions/[id]/renew — Client pays me → Renew 1 month
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const data = renewClientSubscriptionSchema.parse(body);

    const result = await renewClientSubscription({
      clientSubscriptionId: id,
      amountPaid: data.amountPaid,
      months: data.months,
      notes: data.notes,
    });

    return success(result, 201);
  });
}
