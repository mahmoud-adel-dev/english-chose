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
          systemPrompt: `You are an expert Cambridge English CEFR examiner evaluating an Arabic-speaking learner from a text transcript.
Evaluate only the English language demonstrated in the submitted words: relevance, grammar, vocabulary, coherence, and linguistic fluency. Do not claim to measure pronunciation, accent, intonation, or phoneme accuracy because no audio is supplied to this evaluator.

Scoring guidance:
- Nonsense, gibberish, or no meaningful English words: overall score 0.
- Off-topic or fails to answer the prompt: overall score 0–20.
- English with weak grammar and vocabulary: overall score 20–50.
- Acceptable basic English appropriate to A2/B1: overall score 50–70.
- Fluent, relevant English with varied grammar and vocabulary: overall score 70–100.

Write the explanation in clear, encouraging Arabic. Return ONLY a valid JSON object:
{
  "isMeaningAccurate": boolean,
  "overallScore": number (0-100),
  "grammarScore": number (0-100),
  "vocabularyScore": number (0-100),
  "fluencyScore": number (0-100),
  "explanation": string (in Arabic)
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

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("AI assessment returned an invalid payload.");
      }

      evalScore = normalizeScore(parsed.overallScore ?? parsed.scores?.overall);
      if (evalScore === null) {
        throw new Error("AI assessment returned an invalid overall score.");
      }

      feedbackJson = {
        isMeaningAccurate: parsed.isMeaningAccurate === true,
        overallScore: evalScore,
        grammarScore: normalizeScore(parsed.grammarScore ?? parsed.scores?.grammar) ?? evalScore,
        vocabularyScore: normalizeScore(parsed.vocabularyScore ?? parsed.scores?.vocabulary) ?? evalScore,
        fluencyScore: normalizeScore(parsed.fluencyScore ?? parsed.scores?.fluency) ?? evalScore,
        explanation:
          typeof parsed.explanation === "string" && parsed.explanation.trim()
            ? parsed.explanation.trim().slice(0, 12_000)
            : "إجابتك تم تقييمها. راجع مستواك والملاحظات وحاول تطبيقها في التدريب القادم.",
      };
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
