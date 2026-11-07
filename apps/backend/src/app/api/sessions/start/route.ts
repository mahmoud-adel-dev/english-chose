import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType, QuestionType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { DailySessionDto } from "@english-coach/contracts";
import { getQuestionsForCefrLevel } from "@/lib/learning/question-bank";
import { resolveUserQuotaTier } from "@/lib/quotas/tier-resolver";

type SessionWithQuestions = Prisma.DailySessionGetPayload<{
  include: {
    questions: {
      include: { submissions: true };
      orderBy: { orderIndex: "asc" };
    };
  };
}>;

type GeneratedQuestion = {
  questionType: QuestionType;
  promptText: string;
  pedagogicalGoal: string;
  contextHint?: string;
  difficultyScore: number;
};

function toSessionDto(session: SessionWithQuestions, maxAttempts: number): DailySessionDto {
  return {
    id: session.id,
    targetLevel: session.targetLevel,
    status: session.status as "ACTIVE" | "COMPLETED" | "EXPIRED",
    questionsCount: session.questionsCount,
    durationSec: session.durationSec,
    createdAt: session.createdAt.toISOString(),
    questions: session.questions.map((question) => ({
      id: question.id,
      orderIndex: question.orderIndex,
      questionType: question.questionType,
      promptText: question.promptText,
      audioPromptUrl: question.audioPromptUrl,
      pedagogicalGoal: question.pedagogicalGoal,
      contextHint: question.contextHint,
      difficultyScore: question.difficultyScore,
      attemptsUsed: question.submissions.length,
      maxAttempts,
    })),
  };
}

function normalizeGeneratedQuestions(value: unknown): GeneratedQuestion[] {
  if (!Array.isArray(value)) return [];
  const allowedTypes = new Set<string>(Object.values(QuestionType));

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => {
      const promptText = typeof item.promptText === "string" ? item.promptText.trim().slice(0, 1_500) : "";
      const pedagogicalGoal = typeof item.pedagogicalGoal === "string"
        ? item.pedagogicalGoal.trim().slice(0, 500)
        : "Practice clear, relevant English communication.";
      const requestedType = typeof item.questionType === "string" ? item.questionType : "";
      const difficulty = Number(item.difficultyScore);
      return {
        questionType: (allowedTypes.has(requestedType) ? requestedType : "OPEN_SPEECH") as QuestionType,
        promptText,
        pedagogicalGoal: pedagogicalGoal || "Practice clear, relevant English communication.",
        ...(typeof item.contextHint === "string" && item.contextHint.trim()
          ? { contextHint: item.contextHint.trim().slice(0, 500) }
          : {}),
        difficultyScore: Number.isFinite(difficulty) ? Math.max(1, Math.min(5, difficulty)) : 1,
      };
    })
    .filter((item) => item.promptText.length > 0)
    .slice(0, 5);
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

const SESSION_INCLUDE = {
  questions: {
    include: { submissions: true },
    orderBy: { orderIndex: "asc" as const },
  },
} satisfies Prisma.DailySessionInclude;

export async function POST(request: Request) {
  let userId = "";
  let sessionQuotaConsumed = false;
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }
    userId = auth.userId;

    const quotaTier = await resolveUserQuotaTier(userId);

    // Starting a session is idempotent for a learner who already has one active.
    const existingActiveSession = await prisma.dailySession.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: SESSION_INCLUDE,
    });
    if (existingActiveSession) {
      return successResponse(toSessionDto(existingActiveSession, quotaTier.maxAttemptsPerItem), 200);
    }

    const quotaCheck = await QuotaManager.checkAndConsume(userId, "SESSION");
    if (!quotaCheck.allowed) {
      return errorResponse("QUOTA_EXCEEDED", quotaCheck.reason || "Session quota reached", 429);
    }
    sessionQuotaConsumed = true;

    const profile = await prisma.learningProfile.findUnique({ where: { userId } });
    const targetLevel = profile?.currentLevel || "A2";

    let questionsData: GeneratedQuestion[] = [];
    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.QUESTION_GENERATION,
        {
          systemPrompt: `You are an expert Cambridge English examiner and pedagogue. Generate exactly 5 distinct English learning questions for CEFR level ${targetLevel}.
Return ONLY a valid JSON array containing 5 objects with keys:
- questionType (one of: "OPEN_SPEECH", "SENTENCE_REPETITION", "READING_ALOUD", "PICTURE_DESCRIPTION", "CONVERSATION_PROMPT", "GRAMMAR_REPAIR")
- promptText (the learner's question or sentence)
- pedagogicalGoal (what the question tests)
- contextHint (brief optional advice or vocabulary hint)
- difficultyScore (number between 1.0 and 5.0)`,
          userPrompt: `Generate 5 adaptive practice exercises for a learner at ${targetLevel} level. Focus on everyday conversation and correct grammar.`,
          temperature: 0.7,
        },
        { userId }
      );

      let generated: unknown = aiResponse.parsedJson;
      if (!Array.isArray(generated)) {
        const match = aiResponse.content.trim().match(/\[[\s\S]*\]/);
        if (match) generated = JSON.parse(match[0]);
      }
      questionsData = normalizeGeneratedQuestions(generated);
    } catch (aiError) {
      console.warn("AI question generation unavailable; using the reviewed level-specific question bank:", aiError);
    }

    if (questionsData.length < 5) {
      questionsData = getQuestionsForCefrLevel(targetLevel, 5);
    }

    let session: SessionWithQuestions;
    try {
      session = await prisma.dailySession.create({
        data: {
          userId,
          activeSessionKey: userId,
          targetLevel,
          status: "ACTIVE",
          questionsCount: questionsData.length,
          questions: {
            create: questionsData.map((question, index) => ({
              orderIndex: index + 1,
              questionType: question.questionType,
              promptText: question.promptText,
              pedagogicalGoal: question.pedagogicalGoal,
              contextHint: question.contextHint || null,
              difficultyScore: question.difficultyScore || 1,
            })),
          },
        },
        include: SESSION_INCLUDE,
      });
      // The quota is now committed to a real session.
      sessionQuotaConsumed = false;
    } catch (error) {
      // A competing start request may have won the partial unique active-session
      // index. Reuse that session and refund this request's reservation.
      if (!isUniqueConstraintError(error)) throw error;
      const winner = await prisma.dailySession.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: SESSION_INCLUDE,
      });
      if (!winner) throw error;
      sessionQuotaConsumed = false;
      await QuotaManager.refund(userId, "SESSION");
      return successResponse(toSessionDto(winner, quotaTier.maxAttemptsPerItem), 200);
    }

    return successResponse(toSessionDto(session, quotaTier.maxAttemptsPerItem), 201);
  } catch (error) {
    if (userId && sessionQuotaConsumed) {
      await QuotaManager.refund(userId, "SESSION").catch(() => {});
    }
    console.error("Session start error:", error);
    return errorResponse("SERVER_ERROR", "Failed to start daily session", 500);
  }
}
