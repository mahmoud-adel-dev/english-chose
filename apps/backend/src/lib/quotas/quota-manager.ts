import type { UserQuotaUsage } from "@prisma/client";
import { prisma } from "../prisma";
import { resolveUserQuotaTier } from "./tier-resolver";

export type QuotaActionType = "QUESTION" | "SESSION" | "AUDIO";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
  usageId?: string;
}

export class QuotaManager {
  /** Returns today's UTC midnight date for standardized daily tracking. */
  private static getTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private static isValidAmount(action: QuotaActionType, amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (action === "QUESTION" || action === "SESSION") return Number.isInteger(amount);
    return amount <= 24 * 60;
  }

  /**
   * Atomically checks and increments quota usage. Each UPDATE includes the
   * applicable limit in its WHERE clause, preventing concurrent over-consume.
   */
  static async checkAndConsume(
    userId: string,
    action: QuotaActionType,
    amount: number = 1
  ): Promise<QuotaCheckResult> {
    if (!this.isValidAmount(action, amount)) {
      return { allowed: false, remaining: 0, reason: "Invalid quota amount." };
    }

    const today = this.getTodayUtc();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return { allowed: false, remaining: 0, reason: "User account is suspended or inactive." };
    }

    const tier = await resolveUserQuotaTier(userId);
    let usage: UserQuotaUsage;
    try {
      usage = await prisma.userQuotaUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { tierId: tier.id },
        create: {
          userId,
          tierId: tier.id,
          date: today,
          questionsAnswered: 0,
          sessionsCount: 0,
          audioMinutesUsed: 0,
          requestCount: 0,
        },
      });
    } catch (error) {
      // Concurrent first requests can race on the unique (userId, date) key.
      // Recover only from that create race; surface all other database errors.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        const existingUsage = await prisma.userQuotaUsage.findUnique({
          where: { userId_date: { userId, date: today } },
        });
        if (!existingUsage) throw error;
        usage = existingUsage;
      } else {
        throw error;
      }
    }

    let currentUsage: number;
    let limit: number;
    let updateCount: number;
    let message: (used: number) => string;

    if (action === "QUESTION") {
      currentUsage = usage.questionsAnswered;
      limit = tier.maxDailyQuestions;
      message = (used) => `Daily question quota exceeded (${used}/${limit}). Resets tomorrow at 00:00 UTC.`;
      if (limit - currentUsage < amount) {
        return { allowed: false, remaining: Math.max(0, limit - currentUsage), reason: message(currentUsage) };
      }
      const updated = await prisma.userQuotaUsage.updateMany({
        where: { id: usage.id, questionsAnswered: { lte: limit - amount } },
        data: { questionsAnswered: { increment: amount }, requestCount: { increment: 1 } },
      });
      updateCount = updated.count;
    } else if (action === "SESSION") {
      currentUsage = usage.sessionsCount;
      limit = tier.maxDailySessions;
      message = (used) => `Daily practice session limit reached (${used}/${limit}).`;
      if (limit - currentUsage < amount) {
        return { allowed: false, remaining: Math.max(0, limit - currentUsage), reason: message(currentUsage) };
      }
      const updated = await prisma.userQuotaUsage.updateMany({
        where: { id: usage.id, sessionsCount: { lte: limit - amount } },
        data: { sessionsCount: { increment: amount }, requestCount: { increment: 1 } },
      });
      updateCount = updated.count;
    } else {
      currentUsage = usage.audioMinutesUsed;
      limit = tier.maxAudioMinutesDay;
      message = (used) => `Daily voice processing quota reached (${used.toFixed(1)}/${limit} min).`;
      if (limit - currentUsage < amount) {
        return { allowed: false, remaining: Math.max(0, limit - currentUsage), reason: message(currentUsage) };
      }
      const updated = await prisma.userQuotaUsage.updateMany({
        where: { id: usage.id, audioMinutesUsed: { lte: limit - amount } },
        data: { audioMinutesUsed: { increment: amount }, requestCount: { increment: 1 } },
      });
      updateCount = updated.count;
    }

    if (updateCount === 0) {
      // Another request may have consumed the remaining allowance after the
      // initial read. Re-read and return the actual remaining amount.
      const latest = await prisma.userQuotaUsage.findUnique({ where: { id: usage.id } });
      const latestUsed = action === "QUESTION"
        ? latest?.questionsAnswered ?? limit
        : action === "SESSION"
          ? latest?.sessionsCount ?? limit
          : latest?.audioMinutesUsed ?? limit;
      return {
        allowed: false,
        remaining: Math.max(0, limit - latestUsed),
        reason: message(latestUsed),
      };
    }

    const latest = await prisma.userQuotaUsage.findUnique({ where: { id: usage.id } });
    const usedAfter = action === "QUESTION"
      ? latest?.questionsAnswered ?? currentUsage + amount
      : action === "SESSION"
        ? latest?.sessionsCount ?? currentUsage + amount
        : latest?.audioMinutesUsed ?? currentUsage + amount;

    return {
      allowed: true,
      remaining: Math.max(0, limit - usedAfter),
      usageId: usage.id,
    };
  }

  /** Refund a previously consumed allowance without allowing negative counters. */
  static async refund(userId: string, action: QuotaActionType, amount: number = 1): Promise<void> {
    if (!this.isValidAmount(action, amount)) return;

    const today = this.getTodayUtc();
    if (action === "QUESTION") {
      await prisma.userQuotaUsage.updateMany({
        where: { userId, date: today, questionsAnswered: { gte: amount } },
        data: { questionsAnswered: { decrement: amount } },
      });
      return;
    }

    if (action === "SESSION") {
      await prisma.userQuotaUsage.updateMany({
        where: { userId, date: today, sessionsCount: { gte: amount } },
        data: { sessionsCount: { decrement: amount } },
      });
      return;
    }

    await prisma.userQuotaUsage.updateMany({
      where: { userId, date: today, audioMinutesUsed: { gte: amount } },
      data: { audioMinutesUsed: { decrement: amount } },
    });
  }
}
