import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../_helpers";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const sessions = await prisma.conversationSession.findMany({
      where: {
        userId: auth.userId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return successResponse(sessions, 200);
  } catch (error) {
    console.error("Failed to list conversations:", error);
    return errorResponse("SERVER_ERROR", "Failed to list conversations", 500);
  }
}
