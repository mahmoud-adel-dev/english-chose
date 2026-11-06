import { QuotaTier } from "@prisma/client";
import { prisma } from "../prisma";

export function selectEffectiveTier(
  assignedTier: QuotaTier | null,
  freeTier: QuotaTier
): QuotaTier {
  return assignedTier ?? freeTier;
}

export async function resolveUserQuotaTier(userId: string): Promise<QuotaTier> {
  const [user, freeTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { quotaTier: true },
    }),
    prisma.quotaTier.upsert({
      where: { name: "FREE" },
      update: {},
      create: {
        name: "FREE",
        maxDailyQuestions: 15,
        maxDailySessions: 2,
        maxAudioMinutesDay: 10,
        maxAttemptsPerItem: 3,
        requestsPerMinute: 20,
        isActive: true,
      },
    }),
  ]);

  return selectEffectiveTier(user?.quotaTier ?? null, freeTier);
}
