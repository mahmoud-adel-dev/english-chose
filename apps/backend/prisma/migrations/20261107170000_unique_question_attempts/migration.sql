-- Normalize any historical duplicate/out-of-order attempt numbers before
-- enforcing one unique attempt number per question.
WITH ranked_attempts AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "questionId" ORDER BY "createdAt" ASC, "id" ASC) AS attempt_number
  FROM "QuestionSubmission"
)
UPDATE "QuestionSubmission" AS submission
SET "attemptNumber" = ranked_attempts.attempt_number::INTEGER
FROM ranked_attempts
WHERE submission."id" = ranked_attempts."id"
  AND submission."attemptNumber" <> ranked_attempts.attempt_number;

CREATE UNIQUE INDEX "QuestionSubmission_questionId_attemptNumber_key"
ON "QuestionSubmission"("questionId", "attemptNumber");

DROP INDEX IF EXISTS "QuestionSubmission_questionId_attemptNumber_idx";
