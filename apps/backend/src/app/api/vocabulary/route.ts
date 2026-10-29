import { CefrLevelEnum } from "@english-coach/contracts";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, errorResponse, successResponse } from "../_helpers";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  const words = await prisma.savedWord.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  return successResponse(words);
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  try {
    const body = await request.json();
    const word = String(body.word ?? "").trim().toLowerCase();
    const translation = String(body.translation ?? "").trim();
    if (!/^[a-z]+(?:[-'][a-z]+)*$/i.test(word) || !translation) {
      return errorResponse("VALIDATION_ERROR", "A valid English word and translation are required", 400);
    }
    const level = body.level ? CefrLevelEnum.parse(body.level) : undefined;
    const saved = await prisma.savedWord.upsert({
      where: { userId_word: { userId: auth.userId, word } },
      create: {
        userId: auth.userId,
        word,
        translation,
        exampleSentence: body.exampleSentence ? String(body.exampleSentence).trim() : null,
        level,
      },
      update: {
        translation,
        exampleSentence: body.exampleSentence ? String(body.exampleSentence).trim() : null,
        level,
      },
    });
    return successResponse(saved, 201);
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid vocabulary data", 400);
  }
}
