import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";
import {
  configureProviderConnection,
  listProviderGovernance,
} from "@/lib/ai/provider-governance-service";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    return successResponse(await listProviderGovernance(), 200);
  } catch (error) {
    console.error("Admin providers GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve providers", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const body = await request.json();
    if (!body.identifier) return errorResponse("VALIDATION_ERROR", "Provider is required", 400);
    return successResponse(await configureProviderConnection(body), 201);
  } catch (error) {
    console.error("Admin provider create error:", error);
    const message = error instanceof Error ? error.message : "Failed to configure provider";
    return errorResponse("PROVIDER_CONFIGURATION_ERROR", message, 400);
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
