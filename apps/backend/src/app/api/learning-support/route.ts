import { AiTaskType } from "@prisma/client";
import { authenticateRequest, errorResponse, successResponse } from "../_helpers";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { buildLearningSupportRequest } from "@/lib/learning/learning-support-policy";
import { CefrLevelEnum } from "@english-coach/contracts";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  try {
    const body = await request.json();
    const level = CefrLevelEnum.parse(body.level);
    const aiRequest = buildLearningSupportRequest({
      action: String(body.action ?? ""),
      question: String(body.question ?? ""),
      level,
    });
    const result = await AiTaskRouter.executeCompletion(
      AiTaskType.EDUCATIONAL_EXPLANATION,
      aiRequest,
      { userId: auth.userId }
    );
    if (result.modelIdentifier.startsWith("mock-")) {
      return errorResponse("SUPPORT_UNAVAILABLE", "Learning support is temporarily unavailable", 503);
    }
    const content = result.content.trim();
    if (!content) return errorResponse("INVALID_AI_RESPONSE", "Empty learning support response", 503);
    return successResponse({ action: body.action, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const validationError = message === "Question is required" || message === "Unsupported learning support action";
    return errorResponse(validationError ? "VALIDATION_ERROR" : "SUPPORT_UNAVAILABLE", message, validationError ? 400 : 503);
  }
}
