import { prisma } from "@/lib/prisma";
import { QuotaManager } from "@/lib/quotas/quota-manager";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "@/app/api/_helpers";
import { QuestionEvaluationResult } from "@english-coach/contracts";
import { normalizeScore, validateEnglishAnswer } from "@/lib/assessment/answer-policy";

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

    const validation = validateEnglishAnswer(transcript, question.session.targetLevel);
    if (!validation.valid) {
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse(validation.code, validation.message, 400);
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
    } | null = null;

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.ANSWER_EVALUATION,
        {
          systemPrompt: `You are an encouraging and expert Cambridge English language and pronunciation coach.
Evaluate the learner's response against the given prompt.
The response was spoken by the student and captured via speech recognition (or typed).
Pay special attention to spoken English patterns, clarity, natural intonation, and common pronunciation pitfalls.

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
  "explanationMarkdown": string (friendly feedback explaining what went well, pronunciation tips, and what to improve),
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

      const grammar = normalizeScore(parsedEvaluation?.scores?.grammar);
      const vocabulary = normalizeScore(parsedEvaluation?.scores?.vocabulary);
      const overall = normalizeScore(parsedEvaluation?.scores?.overall);
      if (grammar === null || vocabulary === null || overall === null) {
        throw new Error("AI evaluator returned invalid scores");
      }

      evaluationData = {
        isMeaningAccurate: parsedEvaluation.isMeaningAccurate === true,
        correctedSentence:
          typeof parsedEvaluation.correctedSentence === "string"
            ? parsedEvaluation.correctedSentence
            : transcript,
        scores: {
          grammar,
          vocabulary,
          overall,
          fluency: normalizeScore(parsedEvaluation.scores.fluency) ?? overall,
          pronunciation: 0,
        },
        explanationMarkdown:
          typeof parsedEvaluation.explanationMarkdown === "string"
            ? parsedEvaluation.explanationMarkdown
            : "Evaluation completed.",
        identifiedErrors: Array.isArray(parsedEvaluation.identifiedErrors)
          ? parsedEvaluation.identifiedErrors
          : [],
        retryEligible: attemptNumber < 3 && overall < 60,
        isPassed: overall >= 60,
      };
    } catch (aiErr) {
      console.warn("AI evaluation unavailable:", aiErr);
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse(
        "EVALUATION_UNAVAILABLE",
        "Your answer was not saved because reliable evaluation is temporarily unavailable. Please try again.",
        503
      );
    }

    if (!evaluationData) {
      await QuotaManager.refund(userId, "QUESTION");
      return errorResponse("INVALID_EVALUATION", "The evaluator returned an invalid result.", 503);
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
    const currentProfile = await prisma.learningProfile.findUnique({ where: { userId } });
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
      const evalFluency = evaluationData.scores.fluency ?? evaluationData.scores.overall;
      const evalPronunciation = evaluationData.scores.pronunciation ?? evaluationData.scores.overall;
      const newFluency = currentProfile.fluencyScore > 0
        ? (currentProfile.fluencyScore * 0.7) + (evalFluency * 0.3)
        : evalFluency;
      const newPronunciation = currentProfile.pronunciationScore > 0
        ? (currentProfile.pronunciationScore * 0.7) + (evalPronunciation * 0.3)
        : evalPronunciation;

      await prisma.learningProfile.update({
        where: { userId },
        data: {
          overallScore: Math.round(newOverall * 10) / 10,
          grammarScore: Math.round(newGrammar * 10) / 10,
          vocabularyScore: Math.round(newVocab * 10) / 10,
          fluencyScore: Math.round(newFluency * 10) / 10,
          pronunciationScore: Math.round(newPronunciation * 10) / 10,
          dailyStreak: currentProfile.dailyStreak > 0 ? currentProfile.dailyStreak : 1,
          lastTrainedDate: new Date(),
        },
      });
    }

    // Check if all questions in this session have at least one submission
    const allQuestions = await prisma.sessionQuestion.findMany({
      where: { sessionId },
      include: { submissions: true },
    });

    const allDone = allQuestions.every((q) => q.submissions.length > 0);
    if (allDone) {
      await prisma.dailySession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" },
      });
    }

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
