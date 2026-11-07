ALTER TABLE "DailySession"
ADD COLUMN "activeSessionKey" TEXT;

-- Keep the newest active session for each learner and expire older duplicates
-- left by previous client retries or concurrent start requests.
WITH ranked_active_sessions AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC, "id" DESC) AS row_number
  FROM "DailySession"
  WHERE "status" = 'ACTIVE'
)
UPDATE "DailySession"
SET "status" = 'EXPIRED'
WHERE "id" IN (
  SELECT "id"
  FROM ranked_active_sessions
  WHERE row_number > 1
);

UPDATE "DailySession"
SET "activeSessionKey" = "userId"
WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "DailySession_activeSessionKey_key"
ON "DailySession"("activeSessionKey");
