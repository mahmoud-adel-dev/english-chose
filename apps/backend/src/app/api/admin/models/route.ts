import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const models = await prisma.aiModel.findMany({
      include: {
        provider: { select: { id: true, name: true, identifier: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(models, 200);
  } catch (error) {
    console.error("Admin models GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve models", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const body = await request.json();
    const {
      providerId,
      modelIdentifier,
      displayName,
      contextWindow,
      costPerInput1k,
      costPerOutput1k,
      supportsVision,
      supportsAudioIn,
      supportsAudioOut,
    } = body;

    if (!providerId || !modelIdentifier || !displayName) {
      return errorResponse("VALIDATION_ERROR", "providerId, modelIdentifier, and displayName are required", 400);
    }

    const newModel = await prisma.aiModel.create({
      data: {
        providerId,
        modelIdentifier,
        displayName,
        contextWindow: contextWindow ? Number(contextWindow) : 128000,
        costPerInput1k: costPerInput1k ? Number(costPerInput1k) : 0.0015,
        costPerOutput1k: costPerOutput1k ? Number(costPerOutput1k) : 0.006,
        supportsVision: !!supportsVision,
        supportsAudioIn: !!supportsAudioIn,
        supportsAudioOut: !!supportsAudioOut,
      },
      include: {
        provider: true,
      },
    });

    return successResponse(newModel, 201);
  } catch (error) {
    console.error("Admin model create error:", error);
    return errorResponse("SERVER_ERROR", "Failed to create model", 500);
  }
}

