import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { getSubscriptionPlans } from "@/lib/quotas/subscription-service";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const result = await getSubscriptionPlans(auth?.userId);
    return successResponse(result, 200);
  } catch (error) {
    console.error("Failed to fetch subscription plans:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve subscription plans", 500);
  }
}
