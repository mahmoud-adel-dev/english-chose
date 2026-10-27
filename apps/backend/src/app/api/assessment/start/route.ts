import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { AssessmentItemDto } from "@english-coach/contracts";

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
      // Standard CEFR progression prompt
      const prompts = [
        { level: "A1", text: "Describe your family and where you live in 2-3 sentences." },
        { level: "A2", text: "What did you do last weekend? Talk about your activities." },
        { level: "B1", text: "Why is learning English important for your future career or travel?" },
        { level: "B2", text: "Do you think artificial intelligence will replace human jobs in the next 10 years? Why or why not?" },
        { level: "C1", text: "Analyze the societal impact of remote work on urban planning and mental health." },
        { level: "C2", text: "Discuss the nuance between technological determinism and social shaping of technology." },
      ];

      const itemIdx = Math.min(assessment.currentQuestion - 1, prompts.length - 1);
      const chosen = prompts[itemIdx];

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

