import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../../_helpers";
import { AssessmentItemDto, AssessmentResultDto, CefrLevel } from "@english-coach/contracts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const { id: assessmentId } = await params;
    const body = await request.json();
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return errorResponse("VALIDATION_ERROR", "Transcript cannot be empty", 400);
    }

    const assessment = await prisma.cefrAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!assessment || assessment.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Assessment not found", 404);
    }

    if (assessment.status !== "IN_PROGRESS") {
      return errorResponse("INVALID_STATE", "Assessment is already completed", 400);
    }

    // Find current unanswered item or the last item
    const currentItem = assessment.items.find((it) => it.transcript === null) || assessment.items[assessment.items.length - 1];

    if (!currentItem) {
      return errorResponse("NOT_FOUND", "No active item found for assessment", 404);
    }

    // Heuristic / length-based quick evaluation for placement test items
    const wordCount = transcript.split(/\s+/).length;
    let evalScore = Math.min(95, Math.max(50, 60 + wordCount * 2));

    await prisma.assessmentItem.update({
      where: { id: currentItem.id },
      data: {
        transcript,
        evalScore,
      },
    });

    const isLastQuestion = assessment.currentQuestion >= assessment.totalQuestions;

    if (!isLastQuestion) {
      const nextQuestionNum = assessment.currentQuestion + 1;

      const prompts = [
        { level: "A1", text: "Describe your family and where you live in 2-3 sentences." },
        { level: "A2", text: "What did you do last weekend? Talk about your activities." },
        { level: "B1", text: "Why is learning English important for your future career or travel?" },
        { level: "B2", text: "Do you think artificial intelligence will replace human jobs in the next 10 years? Why or why not?" },
        { level: "C1", text: "Analyze the societal impact of remote work on urban planning and mental health." },
        { level: "C2", text: "Discuss the nuance between technological determinism and social shaping of technology." },
      ];

      const nextPrompt = prompts[nextQuestionNum - 1] || prompts[prompts.length - 1];

      const nextItem = await prisma.assessmentItem.create({
        data: {
          assessmentId,
          targetLevel: nextPrompt.level as any,
          promptText: nextPrompt.text,
        },
      });

      await prisma.cefrAssessment.update({
        where: { id: assessmentId },
        data: { currentQuestion: nextQuestionNum },
      });

      const nextItemDto: AssessmentItemDto = {
        id: nextItem.id,
        itemNumber: nextQuestionNum,
        totalItems: assessment.totalQuestions,
        targetLevel: nextItem.targetLevel,
        promptText: nextItem.promptText,
      };

      return successResponse(nextItemDto, 200);
    } else {
      // Completed assessment!
      const allItems = await prisma.assessmentItem.findMany({
        where: { assessmentId },
      });

      const totalScore = allItems.reduce((acc, curr) => acc + (curr.evalScore || 70), 0);
      const avgScore = Math.round(totalScore / (allItems.length || 1));

      let determinedLevel: CefrLevel = "A2";
      if (avgScore >= 90) determinedLevel = "C1";
      else if (avgScore >= 80) determinedLevel = "B2";
      else if (avgScore >= 70) determinedLevel = "B1";
      else if (avgScore >= 60) determinedLevel = "A2";
      else determinedLevel = "A1";

      const completedAt = new Date();

      await prisma.cefrAssessment.update({
        where: { id: assessmentId },
        data: {
          status: "COMPLETED",
          assessedLevel: determinedLevel,
          overallFeedback: `Congratulations! Based on your responses, your assessed level is ${determinedLevel}.`,
          completedAt,
        },
      });

      await prisma.learningProfile.update({
        where: { userId: auth.userId },
        data: {
          currentLevel: determinedLevel,
          overallScore: avgScore,
          grammarScore: Math.min(100, avgScore + 2),
          vocabularyScore: Math.min(100, avgScore - 2),
          fluencyScore: avgScore,
          lastTrainedDate: completedAt,
        },
      });

      const resultDto: AssessmentResultDto = {
        assessmentId,
        assessedLevel: determinedLevel,
        overallScore: avgScore,
        skillBreakdown: {
          grammar: Math.min(100, avgScore + 2),
          vocabulary: Math.min(100, avgScore - 2),
          fluency: avgScore,
        },
        studyPlanSummary: `You are placed at ${determinedLevel}. Focus on complex sentence connectors and professional vocabulary to advance to the next level.`,
        completedAt: completedAt.toISOString(),
      };

      return successResponse(resultDto, 200);
    }
  } catch (error) {
    console.error("Assessment submit error:", error);
    return errorResponse("SERVER_ERROR", "Failed to submit assessment item", 500);
  }
}

