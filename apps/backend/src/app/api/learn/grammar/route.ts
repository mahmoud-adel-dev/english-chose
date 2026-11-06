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

  let response;
  if (levelParam) {
    const topics = getGrammarTopicsByLevel(levelParam);
    response = successResponse({ level: levelParam, topics });
  } else {
    response = successResponse({ topics: GRAMMAR_CATALOG });
  }

  // Caching to save server and database resources
  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400"
  );
  return response;
}

