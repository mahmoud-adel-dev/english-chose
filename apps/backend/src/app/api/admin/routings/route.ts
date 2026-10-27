import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const routings = await prisma.aiTaskRouting.findMany({
      include: {
        primaryModel: { include: { provider: true } },
        fallbackModel: { include: { provider: true } },
      },
      orderBy: { taskType: "asc" },
    });

    return successResponse(routings, 200);
  } catch (error) {
    console.error("Admin routings GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve task routings", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const body = await request.json();
    const { id, primaryModelId, fallbackModelId, systemPromptTpl, temperature, maxTokens, timeoutMs } = body;

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Routing ID is required", 400);
    }

    const updated = await prisma.aiTaskRouting.update({
      where: { id },
      data: {
        ...(primaryModelId ? { primaryModelId } : {}),
        ...(fallbackModelId !== undefined ? { fallbackModelId: fallbackModelId || null } : {}),
        ...(systemPromptTpl !== undefined ? { systemPromptTpl } : {}),
        ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
        ...(maxTokens !== undefined ? { maxTokens: Number(maxTokens) } : {}),
        ...(timeoutMs !== undefined ? { timeoutMs: Number(timeoutMs) } : {}),
      },
      include: {
        primaryModel: { include: { provider: true } },
        fallbackModel: { include: { provider: true } },
      },
    });

    return successResponse(updated, 200);
  } catch (error) {
    console.error("Admin routing PUT error:", error);
    return errorResponse("SERVER_ERROR", "Failed to update task routing", 500);
  }
}

