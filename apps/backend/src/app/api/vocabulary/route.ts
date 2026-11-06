import { prisma } from "@/lib/prisma";
import { parseVocabularyInput } from "@/lib/vocabulary/vocabulary-policy";
import { authenticateRequest, errorResponse, successResponse } from "../_helpers";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  try {
    const words = await prisma.savedWord.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(words);
  } catch (error) {
    console.error("Vocabulary list database error:", error);
    return errorResponse("VOCABULARY_STORAGE_UNAVAILABLE", "Saved words storage is unavailable", 503);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  let input;
  try {
    input = parseVocabularyInput(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid vocabulary data";
    return errorResponse("VALIDATION_ERROR", message, 400);
  }

  try {
    const saved = await prisma.savedWord.upsert({
      where: { userId_word: { userId: auth.userId, word: input.word } },
      create: {
        userId: auth.userId,
        ...input,
      },
      update: {
        translation: input.translation,
        exampleSentence: input.exampleSentence,
        level: input.level,
      },
    });
    return successResponse(saved, 201);
  } catch (error) {
    console.error("Vocabulary save database error:", error);
    return errorResponse("VOCABULARY_STORAGE_UNAVAILABLE", "Could not save the word right now", 503);
  }
}
