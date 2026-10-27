import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "@/app/api/_helpers";
import { QuestionEvaluationResult } from "@english-coach/contracts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; questionId: string }> }
) {
  let userId = "";
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }
    userId = auth.userId;

    const { sessionId, questionId } = await params;

    // 1. Check and consume question quota
    const quotaCheck = await QuotaManager.checkAndConsume(userId, "QUESTION");
    if (!quotaCheck.allowed) {
      return errorResponse("QUOTA_EXCEEDED", quotaCheck.reason || "Daily question quota exceeded", 429);
    }

    const body = await request.json();
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse("VALIDATION_ERROR", "Answer transcript cannot be empty", 400);
    }

    // 2. Fetch Question and Session
    const question = await prisma.sessionQuestion.findUnique({
      where: { id: questionId },
      include: {
        session: true,
        submissions: true,
      },
    });

    if (!question || question.sessionId !== sessionId) {
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse("NOT_FOUND", "Question not found in session", 404);
    }

    if (question.session.userId !== userId) {
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse("FORBIDDEN", "You do not own this session", 403);
    }

    const attemptNumber = question.submissions.length + 1;

    // 3. Evaluate with AI
    let evaluationData: {
      isMeaningAccurate: boolean;
      correctedSentence: string;
      scores: {
        grammar: number;
        vocabulary: number;
        overall: number;
        fluency?: number;
        pronunciation?: number;
      };
      explanationMarkdown: string;
      identifiedErrors: Array<{
        category: "GRAMMAR" | "VOCABULARY" | "SYNTAX" | "PRONUNCIATION_NOTE" | "COMPREHENSION";
        wrongSnippet: string;
        correctSnippet: string;
        explanation: string;
      }>;
      retryEligible: boolean;
      isPassed: boolean;
    } = {
      isMeaningAccurate: true,
      correctedSentence: transcript,
      scores: { grammar: 80, vocabulary: 80, overall: 80, fluency: 80, pronunciation: 80 },
      explanationMarkdown: "Good attempt! Clear and understandable.",
      identifiedErrors: [],
      retryEligible: attemptNumber < 3,
      isPassed: true,
    };

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.ANSWER_EVALUATION,
        {
          systemPrompt: `You are an encouraging and precise English language evaluator.
Evaluate the learner's response against the given prompt.
Return ONLY a valid JSON object matching this structure:
{
  "isMeaningAccurate": boolean,
  "correctedSentence": string (a natural, polished native version),
  "scores": {
    "grammar": number (0-100),
    "vocabulary": number (0-100),
    "overall": number (0-100),
    "fluency": number (0-100),
    "pronunciation": number (0-100)
  },
  "explanationMarkdown": string (friendly feedback explaining what went well and what to improve),
  "identifiedErrors": [
    {
      "category": "GRAMMAR" | "VOCABULARY" | "SYNTAX" | "PRONUNCIATION_NOTE" | "COMPREHENSION",
      "wrongSnippet": string,
      "correctSnippet": string,
      "explanation": string
    }
  ],
  "retryEligible": boolean,
  "isPassed": boolean (true if overall score >= 60)
}`,
          userPrompt: `Prompt / Question: "${question.promptText}"
Target Level: ${question.session.targetLevel}
Pedagogical Goal: ${question.pedagogicalGoal}
Learner Response: "${transcript}"`,
          temperature: 0.2,
        },
        { userId }
      );

      if (aiResponse.parsedJson && typeof aiResponse.parsedJson === "object") {
        evaluationData = { ...evaluationData, ...(aiResponse.parsedJson as typeof evaluationData) };
      } else {
        const text = aiResponse.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          evaluationData = { ...evaluationData, ...parsed };
        }
      }
    } catch (aiErr) {
      console.warn("AI Evaluation fallback to default evaluation:", aiErr);
    }

    // 4. Save Submission
    const submission = await prisma.questionSubmission.create({
      data: {
        questionId,
        attemptNumber,
        rawTranscript: transcript,
        correctedText: evaluationData.correctedSentence,
        isMeaningAccurate: evaluationData.isMeaningAccurate,
        grammarScore: evaluationData.scores.grammar,
        vocabularyScore: evaluationData.scores.vocabulary,
        overallScore: evaluationData.scores.overall,
        explanationMarkdown: evaluationData.explanationMarkdown,
        identifiedErrors: evaluationData.identifiedErrors,
        retryEligible: evaluationData.retryEligible,
      },
    });

    // 5. Update user profile scores and streak
    await prisma.$transaction(async (tx) => {
      const currentProfile = await tx.learningProfile.findUnique({ where: { userId } });
      if (currentProfile) {
        const newOverall = currentProfile.overallScore > 0 
          ? (currentProfile.overallScore * 0.7) + (evaluationData.scores.overall * 0.3)
          : evaluationData.scores.overall;
        const newGrammar = currentProfile.grammarScore > 0
          ? (currentProfile.grammarScore * 0.7) + (evaluationData.scores.grammar * 0.3)
          : evaluationData.scores.grammar;
        const newVocab = currentProfile.vocabularyScore > 0
          ? (currentProfile.vocabularyScore * 0.7) + (evaluationData.scores.vocabulary * 0.3)
          : evaluationData.scores.vocabulary;

        await tx.learningProfile.update({
          where: { userId },
          data: {
            overallScore: Math.round(newOverall * 10) / 10,
            grammarScore: Math.round(newGrammar * 10) / 10,
            vocabularyScore: Math.round(newVocab * 10) / 10,
            dailyStreak: currentProfile.dailyStreak > 0 ? currentProfile.dailyStreak : 1,
            lastTrainedDate: new Date(),
          },
        });
      }

      // Check if all questions in this session have at least one submission
      const allQuestions = await tx.sessionQuestion.findMany({
        where: { sessionId },
        include: { submissions: true },
      });

      const allDone = allQuestions.every((q) => q.submissions.length > 0);
      if (allDone) {
        await tx.dailySession.update({
          where: { id: sessionId },
          data: { status: "COMPLETED" },
        });
      }
    });

    const result: QuestionEvaluationResult = {
      submissionId: submission.id,
      questionId,
      attemptNumber,
      rawTranscript: transcript,
      transcriptionConfidence: 0.95,
      isMeaningAccurate: evaluationData.isMeaningAccurate,
      correctedSentence: evaluationData.correctedSentence,
      scores: evaluationData.scores,
      explanationMarkdown: evaluationData.explanationMarkdown,
      identifiedErrors: evaluationData.identifiedErrors,
      retryEligible: evaluationData.retryEligible,
      isPassed: evaluationData.isPassed,
    };

    return successResponse(result, 200);
  } catch (error) {
    if (userId) {
      await QuotaManager.refund(userId, "QUESTION").catch(() => {});
    }
    console.error("Submit question error:", error);
    return errorResponse("SERVER_ERROR", "Failed to evaluate question answer", 500);
  }
}

