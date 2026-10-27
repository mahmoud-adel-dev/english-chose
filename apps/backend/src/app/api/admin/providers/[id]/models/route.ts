import {
  discoverProviderModels,
  importProviderModels,
} from "@/lib/ai/provider-governance-service";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../../../_helpers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);
  try {
    const { id } = await context.params;
    return successResponse(await discoverProviderModels(id), 200);
  } catch (error) {
    return errorResponse(
      "MODEL_DISCOVERY_FAILED",
      error instanceof Error ? error.message : "Model discovery failed",
      400
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);
  try {
    const { id } = await context.params;
    const body = await request.json();
    if (!Array.isArray(body.modelIdentifiers)) {
      return errorResponse("VALIDATION_ERROR", "modelIdentifiers must be an array", 400);
    }
    return successResponse(await importProviderModels(id, body.modelIdentifiers), 200);
  } catch (error) {
    return errorResponse(
      "MODEL_IMPORT_FAILED",
      error instanceof Error ? error.message : "Model import failed",
      400
    );
  }
}
