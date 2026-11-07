import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../../_helpers";
import { AssessmentItemDto, AssessmentResultDto, CefrLevel } from "@english-coach/contracts";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import {
  assessmentPromptForLevel,
  determineAssessedLevel,
  nextAdaptiveLevel,
  normalizeScore,
  validateEnglishAnswer,
} from "@/lib/assessment/answer-policy";
import { calculateNextDailyStreak } from "@/lib/learning/daily-streak";
import { normalizeAssessmentEvaluation } from "@/lib/assessment/evaluation-policy";

type AssessmentSubmitOutcome =
  | { kind: "NEXT"; item: AssessmentItemDto }
  | { kind: "COMPLETED"; result: AssessmentResultDto };

class AssessmentSubmissionConflictError extends Error {
  constructor() {
    super("The active assessment item was already submitted or the assessment state changed.");
    this.name = "AssessmentSubmissionConflictError";
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const { id: assessmentOrItemId } = await params;
    const body = await request.json().catch(() => ({}));
    const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript) {
      return errorResponse("VALIDATION_ERROR", "Transcript cannot be empty", 400);
    }

    let assessment = await prisma.cefrAssessment.findUnique({
      where: { id: assessmentOrItemId },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    // The mobile client may submit using the active assessment-item ID.
    let targetItemId: string | null = null;
    if (!assessment) {
      const item = await prisma.assessmentItem.findUnique({
        where: { id: assessmentOrItemId },
        include: {
          assessment: { include: { items: { orderBy: { createdAt: "asc" } } } },
        },
      });
      if (item) {
        assessment = item.assessment;
        targetItemId = item.id;
      }
    }

    const activeAssessment = assessment;
    if (!activeAssessment || activeAssessment.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Assessment not found", 404);
    }

    if (activeAssessment.status !== "IN_PROGRESS") {
      return errorResponse("INVALID_STATE", "Assessment is already completed", 409);
    }

    const currentItem = activeAssessment.items.find((item) => item.transcript === null);
    if (!currentItem) {
      return errorResponse("INVALID_STATE", "There is no unanswered item in this assessment.", 409);
    }

    // Do not let clients skip ahead or resubmit an already answered item.
    if (targetItemId && targetItemId !== currentItem.id) {
      return errorResponse("INVALID_STATE", "This is not the active assessment question.", 409);
    }

    const validation = validateEnglishAnswer(transcript, currentItem.targetLevel);
    if (!validation.valid) {
      return errorResponse(validation.code, validation.message, 400);
    }

    let evalScore: number | null = null;
    let feedbackJson: Record<string, unknown> | null = null;

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.ANSWER_EVALUATION,
        {
          systemPrompt: `You are a strict, fair CEFR English-language examiner assessing a learner response to a specific prompt. Evaluate the language the learner actually demonstrated, not what you think they intended to say.

First judge whether the response is meaningful English and whether it genuinely addresses the prompt. Do not reward a response merely because it is long, contains English words, or is grammatically plausible. A fluent but unrelated answer is off-topic and must receive a low overall score. Do not confuse a debatable opinion or a minor factual mistake with an off-topic response: assess language ability, not the learner's beliefs or general knowledge.

Scoring rules:
- If there is no meaningful English, gibberish, or the answer does not communicate an interpretable message: isMeaningfulEnglish=false and overallScore 0-10.
- If the response does not address the prompt, or relevanceScore is below 40: isOnTopic=false and overallScore 0-20.
- If it only partially addresses the prompt (relevanceScore 40-59): overallScore cannot exceed 45.
- If it addresses the prompt only weakly (relevanceScore 60-74): overallScore cannot exceed 64.
- Never assign a high score based on word count alone. Assess grammar control, vocabulary range and precision, coherence, and ability to express the required meaning at the stated target level.
- A response with basic vocabulary and simple sentence patterns must not receive a B2/C1-level score merely because it is understandable.
- Use the target level as the benchmark. Score consistently and conservatively; do not inflate scores to encourage the learner.
- No audio is supplied. Do not score pronunciation, accent, intonation, or phoneme accuracy.

Return ONLY a valid JSON object with every field below. Boolean fields are mandatory:
{
  "isOnTopic": boolean,
  "isMeaningfulEnglish": boolean,
  "relevanceScore": number (0-100),
  "overallScore": number (0-100),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "fluencyScore": number (0-100),
  "explanation": string (clear, encouraging Arabic)
}`,
          userPrompt: `Target Level: ${currentItem.targetLevel}
Prompt: "${currentItem.promptText}"
Learner's Submitted Answer: "${transcript}"`,
          temperature: 0.1,
        },
        { userId: auth.userId }
      );

      let parsed: any = null;
      if (
        aiResponse.parsedJson &&
        typeof aiResponse.parsedJson === "object" &&
        !Array.isArray(aiResponse.parsedJson)
      ) {
        parsed = aiResponse.parsedJson;
      } else {
        const match = aiResponse.content.trim().match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const normalizedEvaluation = normalizeAssessmentEvaluation(parsed);
      if (!normalizedEvaluation) {
        throw new Error("AI assessment returned an incomplete or invalid evaluation payload.");
      }

      evalScore = normalizedEvaluation.overallScore;
      feedbackJson = {
        ...normalizedEvaluation,
        evaluatorModel: aiResponse.modelIdentifier,
      };
      if (normalizedEvaluation.scoreCapReason) {
        console.warn(
          `[CEFR] Applied score cap ${normalizedEvaluation.scoreCapReason} for assessment item ${currentItem.id}`
        );
      }
    } catch (error) {
      console.warn("AI assessment evaluation unavailable:", error);
      return errorResponse(
        "EVALUATION_UNAVAILABLE",
        "Your answer was not saved because reliable evaluation is temporarily unavailable. Please try again.",
        503
      );
    }

    const validatedScore = evalScore;
    const validatedFeedback = feedbackJson;
    if (validatedScore === null || !validatedFeedback) {
      return errorResponse(
        "INVALID_EVALUATION",
        "The evaluator returned an invalid result. Please try again.",
        503
      );
    }

    const isLastQuestion = activeAssessment.currentQuestion >= activeAssessment.totalQuestions;
    const nextLevel = nextAdaptiveLevel(currentItem.targetLevel as CefrLevel, validatedScore);
    const nextPrompt = isLastQuestion ? null : assessmentPromptForLevel(nextLevel);

    const outcome = await prisma.$transaction<AssessmentSubmitOutcome>(async (tx) => {
      // Conditional update makes a simultaneous duplicate submission lose cleanly.
      const itemUpdate = await tx.assessmentItem.updateMany({
        where: { id: currentItem.id, transcript: null },
        data: { transcript, evalScore: validatedScore, feedbackJson: validatedFeedback as any },
      });
      if (itemUpdate.count !== 1) throw new AssessmentSubmissionConflictError();

      if (!isLastQuestion && nextPrompt) {
        const nextQuestionNum = activeAssessment.currentQuestion + 1;
        const nextItem = await tx.assessmentItem.create({
          data: {
            assessmentId: activeAssessment.id,
            targetLevel: nextPrompt.level as any,
            promptText: nextPrompt.text,
          },
        });

        const assessmentUpdate = await tx.cefrAssessment.updateMany({
          where: {
            id: activeAssessment.id,
            status: "IN_PROGRESS",
            currentQuestion: activeAssessment.currentQuestion,
          },
          data: { currentQuestion: nextQuestionNum },
        });
        if (assessmentUpdate.count !== 1) throw new AssessmentSubmissionConflictError();

        return {
          kind: "NEXT",
          item: {
            id: nextItem.id,
            itemNumber: nextQuestionNum,
            totalItems: activeAssessment.totalQuestions,
            targetLevel: nextItem.targetLevel,
            promptText: nextItem.promptText,
          },
        };
      }

      const allItems = await tx.assessmentItem.findMany({
        where: { assessmentId: activeAssessment.id },
        orderBy: { createdAt: "asc" },
      });
      const placement = determineAssessedLevel(
        allItems.map((item) => ({
          targetLevel: item.targetLevel as CefrLevel,
          score: item.evalScore ?? 0,
        }))
      );
      const avgScore = placement.averageScore;
      const determinedLevel = placement.level;

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

      const assessmentUpdate = await tx.cefrAssessment.updateMany({
        where: {
          id: activeAssessment.id,
          status: "IN_PROGRESS",
          currentQuestion: activeAssessment.currentQuestion,
        },
        data: {
          status: "COMPLETED",
          assessedLevel: determinedLevel,
          overallFeedback: `تهانينا! بناءً على إجاباتك تم تحديد مستواك المعتمد في الإنجليزية عند المستوى (${determinedLevel}).`,
          completedAt,
        },
      });
      if (assessmentUpdate.count !== 1) throw new AssessmentSubmissionConflictError();

      const profile = await tx.learningProfile.findUnique({ where: { userId: auth.userId } });
      if (!profile) throw new Error("Learning profile was not found for the assessed user.");
      const nextStreak = calculateNextDailyStreak(
        profile.dailyStreak,
        profile.lastTrainedDate,
        completedAt
      );

      await tx.learningProfile.update({
        where: { userId: auth.userId },
        data: {
          currentLevel: determinedLevel,
          overallScore: avgScore,
          grammarScore,
          vocabularyScore,
          fluencyScore,
          // Placement uses text responses; it cannot produce a valid acoustic pronunciation score.
          dailyStreak: nextStreak,
          lastTrainedDate: completedAt,
        },
      });

      return {
        kind: "COMPLETED",
        result: {
          assessmentId: activeAssessment.id,
          assessedLevel: determinedLevel,
          overallScore: avgScore,
          skillBreakdown: {
            grammar: grammarScore,
            vocabulary: vocabularyScore,
            fluency: fluencyScore,
          },
          studyPlanSummary: `تم تصنيفك في المستوى (${determinedLevel}). خطتك التدريبية: ركّز على ربط الجمل المعقدة وإثراء حصيلتك من المفردات اليومية والمهنية لتصل إلى المستوى التالي بثقة وسلاسة.`,
          completedAt: completedAt.toISOString(),
        },
      };
    });

    if (outcome.kind === "NEXT") {
      return successResponse(outcome.item, 200);
    }
    return successResponse(outcome.result, 200);
  } catch (error) {
    if (error instanceof AssessmentSubmissionConflictError) {
      return errorResponse("ASSESSMENT_ITEM_ALREADY_SUBMITTED", "This assessment item has already been submitted. Refresh the assessment to continue.", 409);
    }
    console.error("Assessment submit error:", error);
    return errorResponse("SERVER_ERROR", "Failed to submit assessment item", 500);
  }
}
