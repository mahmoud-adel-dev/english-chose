-- AlterTable User
ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3);

-- Backfill trialEndsAt for existing users to 6 days from their registration date
UPDATE "User" SET "trialEndsAt" = "createdAt" + INTERVAL '6 days' WHERE "trialEndsAt" IS NULL;

-- AlterTable QuotaTier
ALTER TABLE "QuotaTier" ADD COLUMN "priceMonthlyEgp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "QuotaTier" ADD COLUMN "priceYearlyEgp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "QuotaTier" ADD COLUMN "description" TEXT;
ALTER TABLE "QuotaTier" ADD COLUMN "badge" TEXT;
