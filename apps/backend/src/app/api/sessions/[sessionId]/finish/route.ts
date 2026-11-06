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
          include: { submissions: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!session || session.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Session not found", 404);
    }

    // Mark as completed
    await prisma.dailySession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    // Calculate summary statistics
    let totalScore = 0;
    let grammarTotal = 0;
    let vocabTotal = 0;
    let fluencyTotal = 0;
    let validSubmissionsCount = 0;

    for (const q of session.questions) {
      const sub = q.submissions[q.submissions.length - 1];
      if (sub && sub.overallScore != null) {
        totalScore += sub.overallScore;
        grammarTotal += sub.grammarScore ?? sub.overallScore;
        vocabTotal += sub.vocabularyScore ?? sub.overallScore;
        fluencyTotal += sub.overallScore;
        validSubmissionsCount++;
      }
    }

    const count = validSubmissionsCount > 0 ? validSubmissionsCount : 1;
    const summary = {
      sessionId: session.id,
      targetLevel: session.targetLevel,
      questionsCount: session.questions.length,
      answeredCount: validSubmissionsCount,
      averageScore: Math.round(totalScore / count),
      grammarScore: Math.round(grammarTotal / count),
      vocabularyScore: Math.round(vocabTotal / count),
      fluencyScore: Math.round(fluencyTotal / count),
      status: "COMPLETED",
    };

    return successResponse(summary, 200);
  } catch (error) {
    console.error("Session finish error:", error);
    return errorResponse("SERVER_ERROR", "Failed to finish session", 500);
  }
}
