import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType, QuestionType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { DailySessionDto, SessionQuestionDto } from "@english-coach/contracts";

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

    // Fallback default questions if AI returns fewer than 5
    if (!questionsData || questionsData.length < 5) {
      questionsData = [
        {
          questionType: QuestionType.CONVERSATION_PROMPT,
          promptText: "Introduce yourself and describe your favorite hobby in 2-3 sentences.",
          pedagogicalGoal: "Present simple tense and basic self-expression",
          contextHint: "Use words like 'I enjoy', 'usually', and 'because'.",
          difficultyScore: 1.2,
        },
        {
          questionType: QuestionType.SENTENCE_REPETITION,
          promptText: "Although it was raining outside, we decided to go for a long walk in the park.",
          pedagogicalGoal: "Subordinating conjunctions and complex sentence rhythm",
          contextHint: "Pay attention to the pause after 'outside'.",
          difficultyScore: 2.0,
        },
        {
          questionType: QuestionType.GRAMMAR_REPAIR,
          promptText: "Fix the error in this sentence: 'She don't like drinking coffee in the morning.'",
          pedagogicalGoal: "Subject-verb agreement for third person singular",
          contextHint: "Think about 'does' vs 'do'.",
          difficultyScore: 1.5,
        },
        {
          questionType: QuestionType.READING_ALOUD,
          promptText: "Clear communication is essential when collaborating on global projects with international teams.",
          pedagogicalGoal: "Pronunciation and intonation of multi-syllable professional vocabulary",
          contextHint: "Emphasize 'essential' and 'collaborating'.",
          difficultyScore: 2.5,
        },
        {
          questionType: QuestionType.OPEN_SPEECH,
          promptText: "What are your goals for improving your English this month?",
          pedagogicalGoal: "Expressing future intentions and personal plans",
          contextHint: "Try using 'I aim to...', 'I want to improve...', or 'I plan on...'",
          difficultyScore: 2.8,
        },
      ];
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

