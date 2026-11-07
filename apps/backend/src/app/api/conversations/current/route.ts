import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const session = await prisma.conversationSession.findFirst({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return errorResponse("NO_ACTIVE_CONVERSATION", "No active conversation found", 404);
    }

    return successResponse(session, 200);
  } catch (error) {
    console.error("Failed to retrieve current conversation:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve conversation", 500);
  }
}

