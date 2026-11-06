import { authenticateRequest, errorResponse, successResponse } from "../../../_helpers";
import { getGrammarTopicById } from "@/lib/learn/grammar-catalog";

interface Context {
  params: Promise<{ topicId: string }>;
}

export async function GET(request: Request, context: Context) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { topicId } = await context.params;
  const topic = getGrammarTopicById(topicId);

  if (!topic) {
    return errorResponse("NOT_FOUND", "Grammar topic not found", 404);
  }

  return successResponse({ topic });
}

