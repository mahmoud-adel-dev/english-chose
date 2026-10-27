import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { DailySessionDto } from "@english-coach/contracts";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const session = await prisma.dailySession.findFirst({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          include: { submissions: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!session) {
      return errorResponse("NOT_FOUND", "No active session found", 404);
    }

    const sessionDto: DailySessionDto = {
      id: session.id,
      targetLevel: session.targetLevel,
      status: session.status as "ACTIVE" | "COMPLETED" | "EXPIRED",
      questionsCount: session.questionsCount,
      durationSec: session.durationSec,
      createdAt: session.createdAt.toISOString(),
      questions: session.questions.map((q) => ({
        id: q.id,
        orderIndex: q.orderIndex,
        questionType: q.questionType,
        promptText: q.promptText,
        audioPromptUrl: q.audioPromptUrl,
        pedagogicalGoal: q.pedagogicalGoal,
        contextHint: q.contextHint,
        difficultyScore: q.difficultyScore,
        attemptsUsed: q.submissions.length,
        maxAttempts: 3,
      })),
    };

    return successResponse(sessionDto, 200);
  } catch (error) {
    console.error("Current session error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve current session", 500);
  }
}

