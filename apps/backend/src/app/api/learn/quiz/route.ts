import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { generate50QuestionQuiz } from "@/lib/learn/quiz-generator";
import { CefrLevel } from "@english-coach/contracts";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const levelParam = (searchParams.get("level") as CefrLevel) || undefined;
  const topicId = searchParams.get("topicId") || undefined;

  const quiz = generate50QuestionQuiz({
    level: levelParam,
    topicId: topicId
  });

  return successResponse({ quiz });
}
