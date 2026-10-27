-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('OPEN_SPEECH', 'SENTENCE_REPETITION', 'READING_ALOUD', 'PICTURE_DESCRIPTION', 'CONVERSATION_PROMPT', 'GRAMMAR_REPAIR');

-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('QUESTION_GENERATION', 'ANSWER_EVALUATION', 'CEFR_ASSESSMENT', 'EDUCATIONAL_EXPLANATION', 'PROGRESS_SUMMARY', 'SPEECH_TO_TEXT', 'TEXT_TO_SPEECH', 'PRONUNCIATION_ASSESSMENT');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEGRADED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLevel" "CefrLevel" NOT NULL DEFAULT 'A1',
    "targetLevel" "CefrLevel" NOT NULL DEFAULT 'B2',
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "vocabularyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "grammarScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fluencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pronunciationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastTrainedDate" TIMESTAMP(3),
    "recurringWeaknesses" JSONB NOT NULL DEFAULT '[]',
    "customPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CefrAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessedLevel" "CefrLevel",
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 6,
    "currentQuestion" INTEGER NOT NULL DEFAULT 1,
    "overallFeedback" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CefrAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "targetLevel" "CefrLevel" NOT NULL,
    "promptText" TEXT NOT NULL,
    "audioPromptUrl" TEXT,
    "learnerAudioUrl" TEXT,
    "transcript" TEXT,
    "evalScore" DOUBLE PRECISION,
    "feedbackJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetLevel" "CefrLevel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "questionsCount" INTEGER NOT NULL DEFAULT 5,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "summaryText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "promptText" TEXT NOT NULL,
    "audioPromptUrl" TEXT,
    "pedagogicalGoal" TEXT NOT NULL,
    "contextHint" TEXT,
    "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSubmission" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "audioUrl" TEXT,
    "rawTranscript" TEXT,
    "correctedText" TEXT,
    "isMeaningAccurate" BOOLEAN NOT NULL DEFAULT false,
    "grammarScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "vocabularyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "explanationMarkdown" TEXT NOT NULL,
    "identifiedErrors" JSONB NOT NULL DEFAULT '[]',
    "retryEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKeySecretKey" TEXT NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "priorityOrder" INTEGER NOT NULL DEFAULT 100,
    "maxRpm" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelIdentifier" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL DEFAULT 128000,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "supportsAudioIn" BOOLEAN NOT NULL DEFAULT false,
    "supportsAudioOut" BOOLEAN NOT NULL DEFAULT false,
    "supportsJsonMode" BOOLEAN NOT NULL DEFAULT true,
    "costPerInput1k" DECIMAL(10,6) NOT NULL DEFAULT 0.0015,
    "costPerOutput1k" DECIMAL(10,6) NOT NULL DEFAULT 0.0060,
    "costPerMinute" DECIMAL(10,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskRouting" (
    "id" TEXT NOT NULL,
    "taskType" "AiTaskType" NOT NULL,
    "primaryModelId" TEXT NOT NULL,
    "fallbackModelId" TEXT,
    "systemPromptTpl" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "timeoutMs" INTEGER NOT NULL DEFAULT 15000,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTaskRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "taskId" "AiTaskType" NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "audioDurationSec" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(10,6) NOT NULL DEFAULT 0.0,
    "actualCostUsd" DECIMAL(10,6),
    "statusCode" INTEGER NOT NULL DEFAULT 200,
    "isFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxDailyQuestions" INTEGER NOT NULL DEFAULT 15,
    "maxDailySessions" INTEGER NOT NULL DEFAULT 2,
    "maxAudioMinutesDay" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "maxAttemptsPerItem" INTEGER NOT NULL DEFAULT 3,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "QuotaTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuotaUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "audioMinutesUsed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "detailsJson" JSONB NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProfile_userId_key" ON "LearningProfile"("userId");

-- CreateIndex
CREATE INDEX "CefrAssessment_userId_status_idx" ON "CefrAssessment"("userId", "status");

-- CreateIndex
CREATE INDEX "AssessmentItem_assessmentId_idx" ON "AssessmentItem"("assessmentId");

-- CreateIndex
CREATE INDEX "DailySession_userId_sessionDate_idx" ON "DailySession"("userId", "sessionDate");

-- CreateIndex
CREATE INDEX "SessionQuestion_sessionId_orderIndex_idx" ON "SessionQuestion"("sessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "QuestionSubmission_questionId_attemptNumber_idx" ON "QuestionSubmission"("questionId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_identifier_key" ON "AiProvider"("identifier");

-- CreateIndex
CREATE INDEX "AiProvider_identifier_status_idx" ON "AiProvider"("identifier", "status");

-- CreateIndex
CREATE INDEX "AiModel_modelIdentifier_isActive_idx" ON "AiModel"("modelIdentifier", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_providerId_modelIdentifier_key" ON "AiModel"("providerId", "modelIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "AiTaskRouting_taskType_key" ON "AiTaskRouting"("taskType");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_taskId_createdAt_idx" ON "AiUsageLog"("userId", "taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_providerId_modelId_idx" ON "AiUsageLog"("providerId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaTier_name_key" ON "QuotaTier"("name");

-- CreateIndex
CREATE INDEX "UserQuotaUsage_userId_date_idx" ON "UserQuotaUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuotaUsage_userId_date_key" ON "UserQuotaUsage"("userId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CefrAssessment" ADD CONSTRAINT "CefrAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "CefrAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySession" ADD CONSTRAINT "DailySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionQuestion" ADD CONSTRAINT "SessionQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SessionQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiModel" ADD CONSTRAINT "AiModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskRouting" ADD CONSTRAINT "AiTaskRouting_primaryModelId_fkey" FOREIGN KEY ("primaryModelId") REFERENCES "AiModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskRouting" ADD CONSTRAINT "AiTaskRouting_fallbackModelId_fkey" FOREIGN KEY ("fallbackModelId") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuotaUsage" ADD CONSTRAINT "UserQuotaUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuotaUsage" ADD CONSTRAINT "UserQuotaUsage_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "QuotaTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

