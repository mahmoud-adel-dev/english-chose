import { prisma } from "../prisma";

export type QuotaActionType = "QUESTION" | "SESSION" | "AUDIO";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
  usageId?: string;
}

export class QuotaManager {
  /**
   * Returns today's UTC midnight date for standardized daily tracking.
   */
  private static getTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  /**
   * Atomically checks and increments quota usage using a database transaction.
   */
  static async checkAndConsume(
    userId: string,
    action: QuotaActionType,
    amount: number = 1
  ): Promise<QuotaCheckResult> {
    const today = this.getTodayUtc();

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch user and their default/assigned quota tier
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return { allowed: false, remaining: 0, reason: "User account is suspended or inactive." };
      }

      // Default to FREE tier if none explicitly bound
      const tier = (await tx.quotaTier.findFirst({
        where: { name: "FREE" },
      })) || {
        id: "default",
        maxDailyQuestions: 15,
        maxDailySessions: 2,
        maxAudioMinutesDay: 10.0,
      };

      // 2. Upsert today's usage row
      let usage = await tx.userQuotaUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      });

      if (!usage) {
        usage = await tx.userQuotaUsage.create({
          data: {
            userId,
            tierId: tier.id,
            date: today,
            questionsAnswered: 0,
            sessionsCount: 0,
            audioMinutesUsed: 0.0,
            requestCount: 0,
          },
        });
      }

      // 3. Evaluate limits based on action
      if (action === "QUESTION") {
        const remaining = tier.maxDailyQuestions - usage.questionsAnswered;
        if (remaining < amount) {
          return {
            allowed: false,
            remaining: Math.max(0, remaining),
            reason: `Daily question quota exceeded (${usage.questionsAnswered}/${tier.maxDailyQuestions}). Resets tomorrow at 00:00 UTC.`,
          };
        }

        const updated = await tx.userQuotaUsage.update({
          where: { id: usage.id },
          data: {
            questionsAnswered: { increment: amount },
            requestCount: { increment: 1 },
          },
        });

        return {
          allowed: true,
          remaining: tier.maxDailyQuestions - updated.questionsAnswered,
          usageId: updated.id,
        };
      }

      if (action === "SESSION") {
        const remaining = tier.maxDailySessions - usage.sessionsCount;
        if (remaining < amount) {
          return {
            allowed: false,
            remaining: Math.max(0, remaining),
            reason: `Daily practice session limit reached (${usage.sessionsCount}/${tier.maxDailySessions}).`,
          };
        }

        const updated = await tx.userQuotaUsage.update({
          where: { id: usage.id },
          data: {
            sessionsCount: { increment: amount },
            requestCount: { increment: 1 },
          },
        });

        return {
          allowed: true,
          remaining: tier.maxDailySessions - updated.sessionsCount,
          usageId: updated.id,
        };
      }

      if (action === "AUDIO") {
        const audioMinutes = amount; // in minutes
        const remaining = tier.maxAudioMinutesDay - usage.audioMinutesUsed;
        if (remaining < audioMinutes) {
          return {
            allowed: false,
            remaining: Math.max(0, remaining),
            reason: `Daily voice processing quota reached (${usage.audioMinutesUsed.toFixed(1)}/${tier.maxAudioMinutesDay} min).`,
          };
        }

        const updated = await tx.userQuotaUsage.update({
          where: { id: usage.id },
          data: {
            audioMinutesUsed: { increment: audioMinutes },
            requestCount: { increment: 1 },
          },
        });

        return {
          allowed: true,
          remaining: tier.maxAudioMinutesDay - updated.audioMinutesUsed,
          usageId: updated.id,
        };
      }

      return { allowed: false, remaining: 0, reason: "Unsupported quota action." };
    });
  }

  /**
   * Concurrency-safe refund when an operation fails after quota deduction.
   */
  static async refund(userId: string, action: QuotaActionType, amount: number = 1): Promise<void> {
    const today = this.getTodayUtc();

    await prisma.userQuotaUsage.updateMany({
      where: {
        userId,
        date: today,
      },
      data: {
        ...(action === "QUESTION" ? { questionsAnswered: { decrement: amount } } : {}),
        ...(action === "SESSION" ? { sessionsCount: { decrement: amount } } : {}),
        ...(action === "AUDIO" ? { audioMinutesUsed: { decrement: amount } } : {}),
      },
    });
  }
}
