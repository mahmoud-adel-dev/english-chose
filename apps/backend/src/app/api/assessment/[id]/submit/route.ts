import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../../_helpers";
import { AssessmentItemDto, AssessmentResultDto, CefrLevel } from "@english-coach/contracts";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import {
  assessmentPromptForLevel,
  nextAdaptiveLevel,
  normalizeScore,
  validateEnglishAnswer,
} from "@/lib/assessment/answer-policy";

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

    let assessment = await prisma.cefrAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    // Support submitting by AssessmentItem ID as passed by the client
    let targetItemId: string | null = null;
    if (!assessment) {
      const item = await prisma.assessmentItem.findUnique({
        where: { id: assessmentId },
        include: {
          assessment: {
            include: { items: { orderBy: { createdAt: "asc" } } },
          },
        },
      });
      if (item) {
        assessment = item.assessment;
        targetItemId = item.id;
      }
    }

    if (!assessment || assessment.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Assessment not found", 404);
    }

    if (assessment.status !== "IN_PROGRESS") {
      return errorResponse("INVALID_STATE", "Assessment is already completed", 400);
    }

    // Find current unanswered item or the targeted item
    const currentItem = targetItemId
      ? assessment.items.find((it) => it.id === targetItemId) || assessment.items.find((it) => it.transcript === null) || assessment.items[assessment.items.length - 1]
      : assessment.items.find((it) => it.transcript === null) || assessment.items[assessment.items.length - 1];

    if (!currentItem) {
      return errorResponse("NOT_FOUND", "No active item found for assessment", 404);
    }

    const validation = validateEnglishAnswer(transcript, currentItem.targetLevel);
    if (!validation.valid) {
      return errorResponse(validation.code, validation.message, 400);
    }

    // Real AI Evaluation via AiTaskRouter (Gemini)
    let evalScore = 0;
    let feedbackJson: any = null;

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.ANSWER_EVALUATION,
        {
          systemPrompt: `You are an expert Cambridge English CEFR examiner.
Evaluate the learner's response strictly.
CRITICAL RULES:
- If the response is nonsense, gibberish (e.g. repeated letters like 'jhhhh', random typing, repeated dots, or no actual English words), the score MUST BE 0.
- If the response is off-topic or fails to answer the prompt, score between 0 and 20.
- If the response is in English but has poor grammar/vocabulary, score between 20 and 50.
- Score 50-70 for acceptable basic English matching A2/B1.
- Score 70-100 for fluent, natural English with rich grammar and vocabulary.

Return ONLY a valid JSON object:
{
  "isMeaningAccurate": boolean,
  "overallScore": number (0-100),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "fluencyScore": number (0-100),
  "explanation": string
}`,
          userPrompt: `Target Level: ${currentItem.targetLevel}
Prompt: "${currentItem.promptText}"
Learner's Submitted Answer: "${transcript}"`,
          temperature: 0.1,
        },
        { userId: auth.userId }
      );

      if (aiResponse.modelIdentifier.startsWith("mock-")) {
        throw new Error("No live AI evaluator is available");
      }

      if (aiResponse.parsedJson && typeof aiResponse.parsedJson === "object") {
        const parsed = aiResponse.parsedJson as any;
        evalScore = normalizeScore(parsed.overallScore ?? parsed.scores?.overall) ?? -1;
        feedbackJson = parsed;
      } else {
        const text = aiResponse.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          evalScore = normalizeScore(parsed.overallScore ?? parsed.scores?.overall) ?? -1;
          feedbackJson = parsed;
        }
      }
    } catch (e) {
      console.warn("AI assessment evaluation unavailable:", e);
      return errorResponse(
        "EVALUATION_UNAVAILABLE",
        "Your answer was not saved because reliable evaluation is temporarily unavailable. Please try again.",
        503
      );
    }

    if (evalScore < 0 || !feedbackJson) {
      return errorResponse(
        "INVALID_EVALUATION",
        "The evaluator returned an invalid result. Please try again.",
        503
      );
    }

    await prisma.assessmentItem.update({
      where: { id: currentItem.id },
      data: {
        transcript,
        evalScore,
        feedbackJson,
      },
    });

    const isLastQuestion = assessment.currentQuestion >= assessment.totalQuestions;

    if (!isLastQuestion) {
      const nextQuestionNum = assessment.currentQuestion + 1;

      const nextLevel = nextAdaptiveLevel(currentItem.targetLevel, evalScore);
      const nextPrompt = assessmentPromptForLevel(nextLevel);

      const nextItem = await prisma.assessmentItem.create({
        data: {
          assessmentId: assessment.id,
          targetLevel: nextPrompt.level as any,
          promptText: nextPrompt.text,
        },
      });

      await prisma.cefrAssessment.update({
        where: { id: assessment.id },
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
        where: { assessmentId: assessment.id },
      });

      const totalScore = allItems.reduce((acc, curr) => acc + (curr.evalScore ?? 0), 0);
      const avgScore = Math.round(totalScore / (allItems.length || 1));

      const levelOrder: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
      const passedLevels = allItems
        .filter((item) => (item.evalScore ?? 0) >= 60)
        .map((item) => item.targetLevel as CefrLevel);
      const determinedLevel = passedLevels.reduce<CefrLevel>(
        (highest, level) =>
          levelOrder.indexOf(level) > levelOrder.indexOf(highest) ? level : highest,
        "A1"
      );

      const componentAverage = (key: string, fallback: number) => {
        const values = allItems
          .map((item) => {
            const feedback = item.feedbackJson as Record<string, unknown> | null;
            return normalizeScore(feedback?.[key]);
          })
          .filter((value): value is number => value !== null);
        return values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : fallback;
      };
      const grammarScore = componentAverage("grammarScore", avgScore);
      const vocabularyScore = componentAverage("vocabularyScore", avgScore);
      const fluencyScore = componentAverage("fluencyScore", avgScore);

      const completedAt = new Date();

      await prisma.cefrAssessment.update({
        where: { id: assessment.id },
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
          grammarScore,
          vocabularyScore,
          fluencyScore,
          pronunciationScore: 0,
          lastTrainedDate: completedAt,
        },
      });

      const resultDto: AssessmentResultDto = {
        assessmentId: assessment.id,
        assessedLevel: determinedLevel,
        overallScore: avgScore,
        skillBreakdown: {
          grammar: grammarScore,
          vocabulary: vocabularyScore,
          fluency: fluencyScore,
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
