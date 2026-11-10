import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { SubscribeRequestSchema } from "@english-coach/contracts";
import { subscribeToPlan } from "@/lib/quotas/subscription-service";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = SubscribeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid subscription parameters", 400, parsed.error.format());
    }

    const result = await subscribeToPlan(
      auth.userId,
      parsed.data.tierName,
      parsed.data.billingCycle
    );

    return successResponse(result, 200);
  } catch (error) {
    console.error("Subscription activation error:", error);
    const message = error instanceof Error ? error.message : "Failed to activate subscription plan";
    return errorResponse("SUBSCRIPTION_ERROR", message, 400);
  }
}
