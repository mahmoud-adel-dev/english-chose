import { testProviderConnection } from "@/lib/ai/provider-governance-service";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../../../_helpers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);
  try {
    const { id } = await context.params;
    return successResponse(await testProviderConnection(id), 200);
  } catch (error) {
    return errorResponse(
      "PROVIDER_TEST_FAILED",
      error instanceof Error ? error.message : "Provider test failed",
      400
    );
  }
}
