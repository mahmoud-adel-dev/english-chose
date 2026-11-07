import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "@/app/api/_helpers";
import { QuestionEvaluationResult } from "@english-coach/contracts";
import { normalizeScore, validateEnglishAnswer } from "@/lib/assessment/answer-policy";
import { calculateNextDailyStreak } from "@/lib/learning/daily-streak";
import { resolveUserQuotaTier } from "@/lib/quotas/tier-resolver";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; questionId: string }> }
) {
  let userId = "";
  let quotaConsumed = false;
  let submissionPersisted = false;
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }
    userId = auth.userId;

    const { sessionId, questionId } = await params;

    const body = await request.json();
    const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript) {
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
      return errorResponse("NOT_FOUND", "Question not found in session", 404);
    }

    if (question.session.userId !== userId) {
      return errorResponse("FORBIDDEN", "You do not own this session", 403);
    }

    if (question.session.status !== "ACTIVE") {
      return errorResponse("INVALID_STATE", "This practice session is no longer active.", 409);
    }

    const quotaTier = await resolveUserQuotaTier(userId);
    const sessionQuestions = await prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { orderIndex: "asc" },
      include: { submissions: { orderBy: { attemptNumber: "desc" } } },
    });
    const nextUnanswered = sessionQuestions.find((item) => item.submissions.length === 0);
    const immediatelyPrevious = nextUnanswered
      ? sessionQuestions.find((item) => item.orderIndex === nextUnanswered.orderIndex - 1)
      : sessionQuestions[sessionQuestions.length - 1];
    const previousLatestSubmission = immediatelyPrevious?.submissions[0];
    const previousCanRetry = Boolean(
      immediatelyPrevious &&
      previousLatestSubmission?.retryEligible &&
      immediatelyPrevious.submissions.length < quotaTier.maxAttemptsPerItem
    );
    const isNextUnanswered = nextUnanswered?.id === questionId;
    const isAllowedRetry = previousCanRetry && immediatelyPrevious?.id === questionId;
    if (!isNextUnanswered && !isAllowedRetry) {
      return errorResponse("INVALID_STATE", "Please answer the next question or retry the immediately previous answer if a retry is available.", 409);
    }

    const validation = validateEnglishAnswer(transcript, question.session.targetLevel);
    if (!validation.valid) {
      return errorResponse(validation.code, validation.message, 400);
    }

    if (question.submissions.length >= quotaTier.maxAttemptsPerItem) {
      return errorResponse(
        "MAX_ATTEMPTS_REACHED",
        `You have reached the maximum of ${quotaTier.maxAttemptsPerItem} attempts for this question.`,
        429
      );
    }

    // Consume quota only after the answer, ownership, session state, and attempt
    // limit have all passed validation.
    const quotaCheck = await QuotaManager.checkAndConsume(userId, "QUESTION");
    if (!quotaCheck.allowed) {
      return errorResponse("QUOTA_EXCEEDED", quotaCheck.reason || "Daily question quota exceeded", 429);
    }
    quotaConsumed = true;

    const refundConsumedQuota = async () => {
      if (!quotaConsumed || submissionPersisted) return;
      quotaConsumed = false;
      await QuotaManager.refund(userId, "QUESTION");
    };

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
      };
      explanationMarkdown: string;
      identifiedErrors: Array<{
        category: "GRAMMAR" | "VOCABULARY" | "SYNTAX" | "COMPREHENSION";
        wrongSnippet: string;
        correctSnippet: string;
        explanation: string;
      }>;
      retryEligible: boolean;
      isPassed: boolean;
    } | null = null;

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.ANSWER_EVALUATION,
        {
          systemPrompt: `You are an encouraging and expert Cambridge English language coach evaluating an Arabic-speaking student.
Evaluate the learner's English language response against the given prompt. The input is a text transcript and may come from speech recognition or typing.
Assess grammar, vocabulary, relevance, coherence, and language fluency from the text only. Do not claim to have measured pronunciation, accent, intonation, or phoneme accuracy because no audio recording is supplied to this evaluator.

CRITICAL LANGUAGE INSTRUCTION:
The learner is an Arabic speaker. To help them understand smoothly and learn effortlessly:
- "correctedSentence" MUST be in polished, natural native English.
- In "identifiedErrors":
  - "wrongSnippet" and "correctSnippet" MUST be the English words/phrases.
  - "explanation" MUST be in clear, friendly Arabic explaining WHY the error happened and how to avoid it (e.g. "في اللغة الإنجليزية نستخدم 'a' قبل الأسماء المفردة المعدودة...").
- "explanationMarkdown" MUST BE WRITTEN IN CLEAR, ENCOURAGING ARABIC (باللغة العربية السلسة والمحفزة), with English examples in quotes or italics.
Structure "explanationMarkdown" with friendly Arabic headers like:
### 🌟 ما أحسنت فيه (What went well):
- [Praise specific good vocabulary or structures in Arabic]

### 💡 نصائح للتطوير (Tips for improvement):
- [Actionable advice in Arabic explaining grammar/word choices]

### 🗣️ نصيحة للتحدث بطلاقة (Speaking Tip):
- [Practical language tip based only on the submitted words; do not claim an acoustic pronunciation measurement]

Return ONLY a valid JSON object matching this structure:
{
  "isMeaningAccurate": boolean,
  "correctedSentence": string (a natural, polished native English version),
  "scores": {
    "grammar": number (0-100),
    "vocabulary": number (0-100),
    "overall": number (0-100),
    "fluency": number (0-100)
  },
  "explanationMarkdown": string (friendly feedback in Arabic as specified),
  "identifiedErrors": [
    {
      "category": "GRAMMAR" | "VOCABULARY" | "SYNTAX" | "COMPREHENSION",
      "wrongSnippet": string,
      "correctSnippet": string,
      "explanation": string (in Arabic)
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

      let parsedEvaluation: any = null;

      if (aiResponse.parsedJson && typeof aiResponse.parsedJson === "object") {
        parsedEvaluation = aiResponse.parsedJson;
      } else {
        const text = aiResponse.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedEvaluation = JSON.parse(jsonMatch[0]);
        }
      }

      if (!parsedEvaluation || typeof parsedEvaluation !== "object" || Array.isArray(parsedEvaluation)) {
        throw new Error("AI evaluator returned a non-object payload");
      }

      const grammar = normalizeScore(parsedEvaluation?.scores?.grammar);
      const vocabulary = normalizeScore(parsedEvaluation?.scores?.vocabulary);
      const overall = normalizeScore(parsedEvaluation?.scores?.overall);
      if (grammar === null || vocabulary === null || overall === null) {
        throw new Error("AI evaluator returned invalid scores");
      }

      evaluationData = {
        isMeaningAccurate: parsedEvaluation.isMeaningAccurate === true,
        correctedSentence:
          typeof parsedEvaluation.correctedSentence === "string" && parsedEvaluation.correctedSentence.trim()
            ? parsedEvaluation.correctedSentence.trim().slice(0, 2000)
            : transcript,
        scores: {
          grammar,
          vocabulary,
          overall,
          fluency: normalizeScore(parsedEvaluation.scores.fluency) ?? overall,
        },
        explanationMarkdown:
          typeof parsedEvaluation.explanationMarkdown === "string" && parsedEvaluation.explanationMarkdown.trim()
            ? parsedEvaluation.explanationMarkdown.trim().slice(0, 12000)
            : "تم تقييم إجابتك. راجع الجملة المصححة وحاول تطبيق الملاحظات في المحاولة القادمة.",
        identifiedErrors: Array.isArray(parsedEvaluation.identifiedErrors)
          ? parsedEvaluation.identifiedErrors
              .filter((item: any) =>
                item &&
                ["GRAMMAR", "VOCABULARY", "SYNTAX", "COMPREHENSION"].includes(item.category) &&
                typeof item.wrongSnippet === "string" &&
                typeof item.correctSnippet === "string" &&
                typeof item.explanation === "string"
              )
              .slice(0, 20)
              .map((item: any) => ({
                category: item.category,
                wrongSnippet: item.wrongSnippet.slice(0, 300),
                correctSnippet: item.correctSnippet.slice(0, 300),
                explanation: item.explanation.slice(0, 1200),
              }))
          : [],
        retryEligible: attemptNumber < quotaTier.maxAttemptsPerItem && overall < 60,
        isPassed: overall >= 60,
      };
    } catch (aiErr) {
      console.warn("AI evaluation unavailable:", aiErr);
      await refundConsumedQuota();
      return errorResponse(
        "EVALUATION_UNAVAILABLE",
        "Your answer was not saved because reliable evaluation is temporarily unavailable. Please try again.",
        503
      );
    }

    const validatedEvaluation = evaluationData;
    if (!validatedEvaluation) {
      await refundConsumedQuota();
      return errorResponse("INVALID_EVALUATION", "The evaluator returned an invalid result.", 503);
    }

    // 4. Save the submission and its derived profile/session updates atomically.
    const submission = await prisma.$transaction(async (tx) => {
      const savedSubmission = await tx.questionSubmission.create({
        data: {
          questionId,
          attemptNumber,
          rawTranscript: transcript,
          correctedText: validatedEvaluation.correctedSentence,
          isMeaningAccurate: validatedEvaluation.isMeaningAccurate,
          grammarScore: validatedEvaluation.scores.grammar,
          vocabularyScore: validatedEvaluation.scores.vocabulary,
          fluencyScore: validatedEvaluation.scores.fluency ?? validatedEvaluation.scores.overall,
          overallScore: validatedEvaluation.scores.overall,
          explanationMarkdown: validatedEvaluation.explanationMarkdown,
          identifiedErrors: validatedEvaluation.identifiedErrors,
          retryEligible: validatedEvaluation.retryEligible,
        },
      });

      const currentProfile = await tx.learningProfile.findUnique({ where: { userId } });
      if (currentProfile) {
        const newOverall = currentProfile.overallScore > 0
          ? (currentProfile.overallScore * 0.7) + (validatedEvaluation.scores.overall * 0.3)
          : validatedEvaluation.scores.overall;
        const newGrammar = currentProfile.grammarScore > 0
          ? (currentProfile.grammarScore * 0.7) + (validatedEvaluation.scores.grammar * 0.3)
          : validatedEvaluation.scores.grammar;
        const newVocab = currentProfile.vocabularyScore > 0
          ? (currentProfile.vocabularyScore * 0.7) + (validatedEvaluation.scores.vocabulary * 0.3)
          : validatedEvaluation.scores.vocabulary;
        const evalFluency = validatedEvaluation.scores.fluency ?? validatedEvaluation.scores.overall;
        const newFluency = currentProfile.fluencyScore > 0
          ? (currentProfile.fluencyScore * 0.7) + (evalFluency * 0.3)
          : evalFluency;
        const trainedAt = new Date();
        const nextStreak = calculateNextDailyStreak(
          currentProfile.dailyStreak,
          currentProfile.lastTrainedDate,
          trainedAt
        );

        await tx.learningProfile.update({
          where: { userId },
          data: {
            overallScore: Math.round(newOverall * 10) / 10,
            grammarScore: Math.round(newGrammar * 10) / 10,
            vocabularyScore: Math.round(newVocab * 10) / 10,
            fluencyScore: Math.round(newFluency * 10) / 10,
            // Pronunciation remains unchanged until an actual audio assessment exists.
            dailyStreak: nextStreak,
            lastTrainedDate: trainedAt,
          },
        });
      }

      // Keep the session ACTIVE until the client requests its final summary.
      // This lets the learner resume and see the summary if the app closes
      // after the last answer but before the finish request reaches the server.

      return savedSubmission;
    });
    submissionPersisted = true;
    quotaConsumed = false;

    const result: QuestionEvaluationResult = {
      submissionId: submission.id,
      questionId,
      attemptNumber,
      rawTranscript: transcript,
      isMeaningAccurate: validatedEvaluation.isMeaningAccurate,
      correctedSentence: validatedEvaluation.correctedSentence,
      scores: validatedEvaluation.scores,
      explanationMarkdown: validatedEvaluation.explanationMarkdown,
      identifiedErrors: validatedEvaluation.identifiedErrors,
      retryEligible: validatedEvaluation.retryEligible,
      isPassed: validatedEvaluation.isPassed,
    };

    return successResponse(result, 200);
  } catch (error) {
    if (userId && quotaConsumed && !submissionPersisted) {
      await QuotaManager.refund(userId, "QUESTION").catch(() => {});
    }
    console.error("Submit question error:", error);
    return errorResponse("SERVER_ERROR", "Failed to evaluate question answer", 500);
  }
}
