import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { getTipsByCategory, TIPS_CATALOG } from "@/lib/learn/tips-catalog";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as "PRONUNCIATION" | "LISTENING" | null;

  if (category) {
    const tips = getTipsByCategory(category);
    return successResponse({ category, tips });
  }

  return successResponse({ tips: TIPS_CATALOG });
}

