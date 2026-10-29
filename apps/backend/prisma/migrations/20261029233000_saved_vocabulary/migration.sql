CREATE TABLE "SavedWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "level" "CefrLevel",
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedWord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedWord_userId_word_key" ON "SavedWord"("userId", "word");
CREATE INDEX "SavedWord_userId_createdAt_idx" ON "SavedWord"("userId", "createdAt");
ALTER TABLE "SavedWord" ADD CONSTRAINT "SavedWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
