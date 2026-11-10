import { prisma } from "../prisma";
import type {
  SubscriptionPlanDto,
  UserSubscriptionStatusDto,
} from "@english-coach/contracts";

export const TRIAL_DURATION_DAYS = 6;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface SubscriptionCheck {
  canAccessAi: boolean;
  isSubscribed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  trialEndsAt: Date;
  tierName: string;
  subscriptionExpiresAt: Date | null;
  reason?: string;
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      trialEndsAt: true,
      subscriptionExpiresAt: true,
      quotaTier: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const now = new Date();
  const trialEndsAt = user.trialEndsAt ?? new Date(user.createdAt.getTime() + TRIAL_DURATION_MS);
  const tierName = user.quotaTier?.name || "FREE";

  const isSubscribed =
    tierName !== "FREE" &&
    Boolean(user.subscriptionExpiresAt && user.subscriptionExpiresAt > now);

  const msLeftInTrial = trialEndsAt.getTime() - now.getTime();
  const isTrialActive = !isSubscribed && msLeftInTrial > 0;
  const trialDaysRemaining = Math.max(0, Math.ceil(msLeftInTrial / (24 * 60 * 60 * 1000)));
  const trialHoursRemaining = Math.max(0, Math.ceil(msLeftInTrial / (60 * 60 * 1000)));

  const canAccessAi = isSubscribed || isTrialActive;

  let reason: string | undefined;
  if (!canAccessAi) {
    reason =
      "Your 6-day free trial has expired. Please choose a subscription plan to continue using English Coach AI.";
  }

  return {
    canAccessAi,
    isSubscribed,
    isTrialActive,
    trialDaysRemaining,
    trialHoursRemaining,
    trialEndsAt,
    tierName,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    reason,
  };
}

export async function getSubscriptionPlans(userId?: string): Promise<{
  plans: SubscriptionPlanDto[];
  userStatus?: UserSubscriptionStatusDto;
}> {
  let userStatus: UserSubscriptionStatusDto | undefined;
  let currentTierName = "FREE";

  if (userId) {
    const status = await getUserSubscriptionStatus(userId);
    currentTierName = status.tierName;
    userStatus = {
      tierName: status.tierName,
      isSubscribed: status.isSubscribed,
      subscriptionExpiresAt: status.subscriptionExpiresAt?.toISOString() ?? null,
      isTrialActive: status.isTrialActive,
      trialDaysRemaining: status.trialDaysRemaining,
      trialHoursRemaining: status.trialHoursRemaining,
      trialEndsAt: status.trialEndsAt.toISOString(),
      canAccessAi: status.canAccessAi,
    };
  }

  const tiers = await prisma.quotaTier.findMany({
    where: { isActive: true },
    orderBy: { priceMonthlyEgp: "asc" },
  });

  const plans: SubscriptionPlanDto[] = tiers.map((tier) => {
    // Annual savings calculation
    // e.g. 300 * 12 = 3600. priceYearly = 2880. Savings = (3600 - 2880) / 3600 = 20%
    const annualBase = tier.priceMonthlyEgp * 12;
    const savings = annualBase > 0 ? Math.round(((annualBase - tier.priceYearlyEgp) / annualBase) * 100) : 0;

    return {
      id: tier.id,
      name: tier.name,
      badge: tier.badge,
      description: tier.description,
      priceMonthlyEgp: tier.priceMonthlyEgp,
      priceYearlyEgp: tier.priceYearlyEgp,
      annualSavingsPercent: savings,
      maxDailyQuestions: tier.maxDailyQuestions,
      maxDailySessions: tier.maxDailySessions,
      maxAudioMinutesDay: tier.maxAudioMinutesDay,
      maxAttemptsPerItem: tier.maxAttemptsPerItem,
      requestsPerMinute: tier.requestsPerMinute,
      isCurrent: tier.name === currentTierName,
    };
  });

  return { plans, userStatus };
}

export async function subscribeToPlan(
  userId: string,
  tierName: "BASIC" | "PRO" | "PREMIUM",
  billingCycle: "MONTHLY" | "YEARLY" = "MONTHLY"
): Promise<{
  success: boolean;
  tierName: string;
  subscriptionExpiresAt: Date;
  message: string;
}> {
  const targetTier = await prisma.quotaTier.findUnique({
    where: { name: tierName },
  });

  if (!targetTier || !targetTier.isActive) {
    throw new Error(`Plan ${tierName} is currently unavailable.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, subscriptionExpiresAt: true, quotaTierId: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const now = new Date();
  const currentExpiry =
    user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
      ? user.subscriptionExpiresAt
      : now;

  const durationDays = billingCycle === "YEARLY" ? 365 : 30;
  const newExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      quotaTierId: targetTier.id,
      subscriptionExpiresAt: newExpiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIBE_PLAN",
      resource: "QuotaTier",
      detailsJson: {
        tierName,
        billingCycle,
        durationDays,
        expiresAt: newExpiresAt.toISOString(),
      },
    },
  });

  return {
    success: true,
    tierName: targetTier.name,
    subscriptionExpiresAt: newExpiresAt,
    message: `Successfully activated ${targetTier.name} plan (${billingCycle.toLowerCase()}).`,
  };
}
