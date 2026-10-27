import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../_helpers";
import { QuotaUsageDto } from "@english-coach/contracts";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const tier = (await prisma.quotaTier.findFirst({
      where: { name: "FREE" },
    })) || {
      id: "default",
      name: "FREE",
      maxDailyQuestions: 15,
      maxDailySessions: 2,
      maxAudioMinutesDay: 10.0,
    };

    const usage = await prisma.userQuotaUsage.findUnique({
      where: {
        userId_date: {
          userId: auth.userId,
          date: today,
        },
      },
    });

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const questionsAnswered = usage?.questionsAnswered ?? 0;
    const sessionsCount = usage?.sessionsCount ?? 0;
    const audioMinutesUsed = usage?.audioMinutesUsed ?? 0.0;

    const quotaDto: QuotaUsageDto = {
      dailyQuestionsRemaining: Math.max(0, tier.maxDailyQuestions - questionsAnswered),
      dailySessionsRemaining: Math.max(0, tier.maxDailySessions - sessionsCount),
      audioMinutesRemaining: Math.max(0, tier.maxAudioMinutesDay - audioMinutesUsed),
      tierName: tier.name,
      resetsAtUtc: tomorrow.toISOString(),
    };

    return successResponse(quotaDto, 200);
  } catch (error) {
    console.error("Quota GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve quota", 500);
  }
}

