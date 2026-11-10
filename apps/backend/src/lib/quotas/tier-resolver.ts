import { QuotaTier } from "@prisma/client";
import { prisma } from "../prisma";

export function selectEffectiveTier(
  assignedTier: QuotaTier | null,
  freeTier: QuotaTier,
  subscriptionExpiresAt?: Date | null
): QuotaTier {
  if (!assignedTier) return freeTier;
  if (assignedTier.name === "FREE") return freeTier;

  // If subscription has expired, revert to free tier
  if (subscriptionExpiresAt && subscriptionExpiresAt <= new Date()) {
    return freeTier;
  }

  return assignedTier;
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
        maxDailyQuestions: 10,
        maxDailySessions: 1,
        maxAudioMinutesDay: 5,
        maxAttemptsPerItem: 2,
        requestsPerMinute: 10,
        priceMonthlyEgp: 0,
        priceYearlyEgp: 0,
        description: "تجربة مجانية لمدة 6 أيام لجميع خدمات المدرب الذكي والتقييم الفوري",
        badge: "تجربة 6 أيام",
        isActive: true,
      },
    }),
  ]);

  return selectEffectiveTier(user?.quotaTier ?? null, freeTier, user?.subscriptionExpiresAt);
}
