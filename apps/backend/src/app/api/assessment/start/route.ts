import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { AssessmentItemDto } from "@english-coach/contracts";
import { assessmentPromptForLevel } from "@/lib/assessment/answer-policy";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    // 1. Check for existing in-progress assessment
    let assessment = await prisma.cefrAssessment.findFirst({
      where: {
        userId: auth.userId,
        status: "IN_PROGRESS",
      },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!assessment) {
      // Create new assessment
      assessment = await prisma.cefrAssessment.create({
        data: {
          userId: auth.userId,
          status: "IN_PROGRESS",
          totalQuestions: 6,
          currentQuestion: 1,
        },
        include: { items: true },
      });
    }

    // 2. If there are existing unanswered items, return the current one
    let currentItem = assessment.items.find((item) => item.transcript === null);

    if (!currentItem) {
      // Begin in the middle of the CEFR scale; later questions adapt to performance.
      const chosen = assessmentPromptForLevel("B1");

      currentItem = await prisma.assessmentItem.create({
        data: {
          assessmentId: assessment.id,
          targetLevel: chosen.level as any,
          promptText: chosen.text,
        },
      });
    }

    const itemDto: AssessmentItemDto = {
      id: currentItem.id,
      itemNumber: assessment.currentQuestion,
      totalItems: assessment.totalQuestions,
      targetLevel: currentItem.targetLevel,
      promptText: currentItem.promptText,
      audioPromptUrl: currentItem.audioPromptUrl,
    };

    return successResponse(itemDto, 201);
  } catch (error) {
    console.error("Assessment start error:", error);
    return errorResponse("SERVER_ERROR", "Failed to start CEFR placement assessment", 500);
  }
}
