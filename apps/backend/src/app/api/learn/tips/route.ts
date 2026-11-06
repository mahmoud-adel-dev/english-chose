import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { getTipsByCategory, TIPS_CATALOG } from "@/lib/learn/tips-catalog";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as "PRONUNCIATION" | "LISTENING" | null;

  let response;
  if (category) {
    const tips = getTipsByCategory(category);
    response = successResponse({ category, tips });
  } else {
    response = successResponse({ tips: TIPS_CATALOG });
  }

  // Caching to minimize server resource consumption
  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400"
  );
  return response;
}

