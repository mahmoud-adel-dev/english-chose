ALTER TABLE "AiProvider"
  ADD COLUMN "credentialSource" TEXT NOT NULL DEFAULT 'ENV_REFERENCE',
  ADD COLUMN "inferenceCredential" JSONB,
  ADD COLUMN "managementCredential" JSONB,
  ADD COLUMN "inferenceKeyLastFour" TEXT,
  ADD COLUMN "managementKeyLastFour" TEXT,
  ADD COLUMN "credentialHealth" TEXT NOT NULL DEFAULT 'UNTESTED',
  ADD COLUMN "credentialReason" TEXT,
  ADD COLUMN "providerErrorCode" TEXT,
  ADD COLUMN "lastTestedAt" TIMESTAMP(3),
  ADD COLUMN "lastTestLatencyMs" INTEGER,
  ADD COLUMN "quotaSnapshot" JSONB,
  ADD COLUMN "quotaRefreshedAt" TIMESTAMP(3),
  ADD COLUMN "discoverySnapshot" JSONB,
  ADD COLUMN "modelsDiscoveredAt" TIMESTAMP(3);

ALTER TABLE "AiModel"
  ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pricingSource" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "sourceMetadata" JSONB,
  ADD COLUMN "discoveredAt" TIMESTAMP(3);
