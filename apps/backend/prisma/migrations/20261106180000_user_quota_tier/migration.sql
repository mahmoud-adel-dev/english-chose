ALTER TABLE "QuotaTier" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "User" ADD COLUMN "quotaTierId" TEXT;

ALTER TABLE "User" ADD CONSTRAINT "User_quotaTierId_fkey"
FOREIGN KEY ("quotaTierId") REFERENCES "QuotaTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_quotaTierId_idx" ON "User"("quotaTierId");
