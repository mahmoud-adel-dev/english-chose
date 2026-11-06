ALTER TABLE "User"
ADD COLUMN "googleSubject" TEXT,
ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'PASSWORD';

CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

CREATE TABLE "GoogleAuthConfig" (
  "id" TEXT NOT NULL DEFAULT 'google',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "webClientId" TEXT,
  "androidClientId" TEXT,
  "iosClientId" TEXT,
  "clientSecretCredential" JSONB,
  "clientSecretLastFour" TEXT,
  "apiKeyCredential" JSONB,
  "apiKeyLastFour" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleAuthConfig_pkey" PRIMARY KEY ("id")
);
