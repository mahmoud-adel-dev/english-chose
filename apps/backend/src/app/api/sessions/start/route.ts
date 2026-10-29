import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType, QuestionType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { DailySessionDto, SessionQuestionDto } from "@english-coach/contracts";
import { getQuestionsForCefrLevel } from "@/lib/learning/question-bank";

export async function POST(request: Request) {
  let userId = "";
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }
    userId = auth.userId;

    // 1. Check and consume session quota
    const quotaCheck = await QuotaManager.checkAndConsume(userId, "SESSION");
    if (!quotaCheck.allowed) {
      return errorResponse("QUOTA_EXCEEDED", quotaCheck.reason || "Session quota reached", 429);
    }

    // 2. Get user's level
    const profile = await prisma.learningProfile.findUnique({
      where: { userId },
    });
    const targetLevel = profile?.currentLevel || "A2";

    // 3. Generate questions via AI or structured fallback
    let questionsData: Array<{
      questionType: QuestionType;
      promptText: string;
      pedagogicalGoal: string;
      contextHint?: string;
      difficultyScore: number;
    }> = [];

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.QUESTION_GENERATION,
        {
          systemPrompt: `You are an expert Cambridge English examiner and pedagogue. Generate 5 distinct English learning questions for CEFR level ${targetLevel}.
Return ONLY a valid JSON array containing 5 objects with keys:
- questionType (must be one of: "OPEN_SPEECH", "SENTENCE_REPETITION", "READING_ALOUD", "PICTURE_DESCRIPTION", "CONVERSATION_PROMPT", "GRAMMAR_REPAIR")
- promptText (the question or sentence for the student)
- pedagogicalGoal (what this question tests)
- contextHint (brief advice or vocabulary hint)
- difficultyScore (number between 1.0 and 5.0)`,
          userPrompt: `Generate 5 adaptive practice exercises for a learner at ${targetLevel} level. Focus on everyday conversation and correct grammar.`,
          temperature: 0.7,
        },
        { userId }
      );

      if (aiResponse.parsedJson && Array.isArray(aiResponse.parsedJson)) {
        questionsData = aiResponse.parsedJson as typeof questionsData;
      } else {
        const text = aiResponse.content.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questionsData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (aiErr) {
      console.warn("AI Question generation fallback triggered:", aiErr);
    }

    // Fallback default questions tailored specifically to the user's CEFR level
    if (!questionsData || questionsData.length < 5) {
      questionsData = getQuestionsForCefrLevel(targetLevel, 5);
    }

    // 4. Create Session in DB
    const session = await prisma.dailySession.create({
      data: {
        userId,
        targetLevel,
        status: "ACTIVE",
        questionsCount: questionsData.length,
        questions: {
          create: questionsData.map((q, idx) => ({
            orderIndex: idx + 1,
            questionType: q.questionType,
            promptText: q.promptText,
            pedagogicalGoal: q.pedagogicalGoal,
            contextHint: q.contextHint || null,
            difficultyScore: q.difficultyScore || 1.0,
          })),
        },
      },
      include: {
        questions: {
          include: { submissions: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

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

    return successResponse(sessionDto, 201);
  } catch (error) {
    if (userId) {
      await QuotaManager.refund(userId, "SESSION").catch(() => {});
    }
    console.error("Session start error:", error);
    return errorResponse("SERVER_ERROR", "Failed to start daily session", 500);
  }
}

