import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../../_helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const { sessionId } = await params;

    const session = await prisma.dailySession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: { submissions: { orderBy: { attemptNumber: "asc" } } },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!session || session.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Session not found", 404);
    }

    // Calculate summary statistics
    let totalScore = 0;
    let grammarTotal = 0;
    let vocabTotal = 0;
    let fluencyTotal = 0;
    let validFluencyCount = 0;
    let validSubmissionsCount = 0;

    for (const q of session.questions) {
      const sub = q.submissions[q.submissions.length - 1];
      if (sub && sub.overallScore != null) {
        totalScore += sub.overallScore;
        grammarTotal += sub.grammarScore ?? sub.overallScore;
        vocabTotal += sub.vocabularyScore ?? sub.overallScore;
        if (sub.fluencyScore != null) {
          fluencyTotal += sub.fluencyScore;
          validFluencyCount++;
        }
        validSubmissionsCount++;
      }
    }

    if (validSubmissionsCount === 0) {
      return errorResponse("NO_ANSWERS", "Answer at least one exercise before completing this session.", 409);
    }

    const count = validSubmissionsCount;
    if (session.status === "EXPIRED") {
      return errorResponse("INVALID_STATE", "An expired session cannot be completed.", 409);
    }

    // Do not close an empty session; it remains resumable after this response.
    if (session.status === "ACTIVE") {
      const completed = await prisma.dailySession.updateMany({
        where: { id: sessionId, userId: auth.userId, status: "ACTIVE" },
        data: { status: "COMPLETED", activeSessionKey: null },
      });
      if (completed.count !== 1) {
        const latest = await prisma.dailySession.findUnique({
          where: { id: sessionId },
          select: { status: true },
        });
        if (latest?.status !== "COMPLETED") {
          return errorResponse("INVALID_STATE", "This session changed state before it could be completed.", 409);
        }
      }
    }

    const summary = {
      sessionId: session.id,
      targetLevel: session.targetLevel,
      questionsCount: session.questions.length,
      answeredCount: validSubmissionsCount,
      averageScore: Math.round(totalScore / count),
      grammarScore: Math.round(grammarTotal / count),
      vocabularyScore: Math.round(vocabTotal / count),
      fluencyScore: validFluencyCount > 0 ? Math.round(fluencyTotal / validFluencyCount) : null,
      status: "COMPLETED",
    };

    return successResponse(summary, 200);
  } catch (error) {
    console.error("Session finish error:", error);
    return errorResponse("SERVER_ERROR", "Failed to finish session", 500);
  }
}

