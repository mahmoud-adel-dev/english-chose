import { z } from "zod";

// ============================================================================
// 1. Common Response Envelope
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// 2. CEFR Taxonomy & Pedagogical Enums
// ============================================================================

export const CefrLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevelEnum>;

export const QuestionTypeEnum = z.enum([
  "OPEN_SPEECH",
  "SENTENCE_REPETITION",
  "READING_ALOUD",
  "PICTURE_DESCRIPTION",
  "CONVERSATION_PROMPT",
  "GRAMMAR_REPAIR"
]);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const ErrorCategoryEnum = z.enum([
  "GRAMMAR",
  "VOCABULARY",
  "SYNTAX",
  "PRONUNCIATION_NOTE",
  "COMPREHENSION"
]);
export type ErrorCategory = z.infer<typeof ErrorCategoryEnum>;

// ============================================================================
// 3. Authentication & User Profile
// ============================================================================

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters")
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
}

export interface LearningProfileDto {
  userId: string;
  currentLevel: CefrLevel;
  targetLevel: CefrLevel;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  dailyStreak: number;
  lastTrainedDate: string | null;
  recurringWeaknesses: string[];
}

export interface AuthResponseData {
  user: UserDto;
  profile: LearningProfileDto;
  token: string;
}

// ============================================================================
// 4. Daily Training & Exercise Workflow
// ============================================================================

export interface SessionQuestionDto {
  id: string;
  orderIndex: number;
  questionType: QuestionType;
  promptText: string;
  audioPromptUrl?: string | null;
  pedagogicalGoal: string;
  contextHint?: string | null;
  difficultyScore: number;
  attemptsUsed: number;
  maxAttempts: number;
}

export interface DailySessionDto {
  id: string;
  targetLevel: CefrLevel;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  questionsCount: number;
  durationSec: number;
  questions: SessionQuestionDto[];
  createdAt: string;
}

// ============================================================================
// 5. Audio Submission & Educational Evaluation Contracts
// ============================================================================

export const IdentifiedErrorSchema = z.object({
  category: ErrorCategoryEnum,
  wrongSnippet: z.string(),
  correctSnippet: z.string(),
  explanation: z.string()
});
export type IdentifiedError = z.infer<typeof IdentifiedErrorSchema>;

export const QuestionEvaluationResultSchema = z.object({
  submissionId: z.string(),
  questionId: z.string(),
  attemptNumber: z.number().int().positive(),
  rawTranscript: z.string(),
  transcriptionConfidence: z.number().min(0).max(1).optional(),
  isMeaningAccurate: z.boolean(),
  correctedSentence: z.string(),
  scores: z.object({
    grammar: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100).optional(),
    pronunciation: z.number().min(0).max(100).optional()
  }),
  explanationMarkdown: z.string(),
  identifiedErrors: z.array(IdentifiedErrorSchema),
  retryEligible: z.boolean(),
  isPassed: z.boolean()
});
export type QuestionEvaluationResult = z.infer<typeof QuestionEvaluationResultSchema>;

// ============================================================================
// 6. CEFR Placement Assessment
// ============================================================================

export interface AssessmentItemDto {
  id: string;
  itemNumber: number;
  totalItems: number;
  targetLevel: CefrLevel;
  promptText: string;
  audioPromptUrl?: string | null;
}

export interface AssessmentResultDto {
  assessmentId: string;
  assessedLevel: CefrLevel;
  overallScore: number;
  skillBreakdown: {
    grammar: number;
    vocabulary: number;
    fluency: number;
  };
  studyPlanSummary: string;
  completedAt: string;
}

// ============================================================================
// 7. AI Task Routing & Quota Governance
// ============================================================================

export const AiTaskTypeEnum = z.enum([
  "QUESTION_GENERATION",
  "ANSWER_EVALUATION",
  "CEFR_ASSESSMENT",
  "EDUCATIONAL_EXPLANATION",
  "PROGRESS_SUMMARY",
  "SPEECH_TO_TEXT",
  "TEXT_TO_SPEECH",
  "PRONUNCIATION_ASSESSMENT"
]);
export type AiTaskType = z.infer<typeof AiTaskTypeEnum>;

export interface QuotaUsageDto {
  dailyQuestionsRemaining: number;
  dailySessionsRemaining: number;
  audioMinutesRemaining: number;
  tierName: string;
  resetsAtUtc: string;
}

export interface AdminUsageAnalyticsDto {
  date: string;
  provider: string;
  model: string;
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  audioDurationSec: number;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  avgLatencyMs: number;
  errorCount: number;
}
