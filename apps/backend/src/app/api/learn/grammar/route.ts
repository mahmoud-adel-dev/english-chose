import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { getGrammarTopicsByLevel, GRAMMAR_CATALOG } from "@/lib/learn/grammar-catalog";
import { CefrLevel } from "@english-coach/contracts";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const levelParam = searchParams.get("level") as CefrLevel | null;

  if (levelParam) {
    const topics = getGrammarTopicsByLevel(levelParam);
    return successResponse({ level: levelParam, topics });
  }

  return successResponse({ topics: GRAMMAR_CATALOG });
}
