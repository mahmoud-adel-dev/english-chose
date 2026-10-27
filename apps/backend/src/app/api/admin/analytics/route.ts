import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const logs = await prisma.aiUsageLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        provider: { select: { name: true, identifier: true } },
        model: { select: { displayName: true, modelIdentifier: true } },
      },
    });

    const totalRequests = await prisma.aiUsageLog.count();
    const aggregate = await prisma.aiUsageLog.aggregate({
      _sum: {
        promptTokens: true,
        completionTokens: true,
        durationMs: true,
        estimatedCostUsd: true,
      },
      _avg: {
        durationMs: true,
      },
    });

    const errorCount = await prisma.aiUsageLog.count({
      where: { statusCode: { gte: 400 } },
    });

    // Grouping by model
    const byModel = await prisma.aiUsageLog.groupBy({
      by: ["modelId"],
      _count: { _all: true },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        estimatedCostUsd: true,
      },
    });

    // Grouping by task
    const byTask = await prisma.aiUsageLog.groupBy({
      by: ["taskId"],
      _count: { _all: true },
      _sum: {
        estimatedCostUsd: true,
      },
    });

    // Populate model names
    const models = await prisma.aiModel.findMany({
      select: { id: true, displayName: true, modelIdentifier: true },
    });
    const modelMap = new Map(models.map((m) => [m.id, m.displayName]));

    const modelBreakdown = byModel.map((item) => ({
      modelId: item.modelId,
      name: modelMap.get(item.modelId) || item.modelId,
      requests: item._count._all,
      tokens: (item._sum.promptTokens || 0) + (item._sum.completionTokens || 0),
      costUsd: Number(item._sum.estimatedCostUsd || 0),
    }));

    const taskBreakdown = byTask.map((item) => ({
      taskType: item.taskId,
      requests: item._count._all,
      costUsd: Number(item._sum.estimatedCostUsd || 0),
    }));

    return successResponse(
      {
        summary: {
          totalRequests,
          totalPromptTokens: aggregate._sum.promptTokens || 0,
          totalCompletionTokens: aggregate._sum.completionTokens || 0,
          totalTokens:
            (aggregate._sum.promptTokens || 0) + (aggregate._sum.completionTokens || 0),
          totalCostUsd: Number(aggregate._sum.estimatedCostUsd || 0),
          avgLatencyMs: Math.round(aggregate._avg.durationMs || 0),
          errorCount,
        },
        modelBreakdown,
        taskBreakdown,
        recentLogs: logs.map((log) => ({
          id: log.id,
          taskType: log.taskId,
          provider: log.provider.name,
          model: log.model.displayName,
          promptTokens: log.promptTokens,
          completionTokens: log.completionTokens,
          durationMs: log.durationMs,
          costUsd: Number(log.estimatedCostUsd),
          statusCode: log.statusCode,
          isFallback: log.isFallbackUsed,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt.toISOString(),
        })),
      },
      200
    );
  } catch (error) {
    console.error("Admin analytics error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve analytics", 500);
  }
}

