import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, resolveUserQuotaTierMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    userQuotaUsage: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  resolveUserQuotaTierMock: vi.fn(),
}));

vi.mock("../src/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../src/lib/quotas/tier-resolver", () => ({
  resolveUserQuotaTier: resolveUserQuotaTierMock,
}));

import { QuotaManager } from "../src/lib/quotas/quota-manager";

describe("atomic quota consumption policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: "learner-1", isActive: true });
    resolveUserQuotaTierMock.mockResolvedValue({
      id: "free-tier",
      maxDailyQuestions: 15,
      maxDailySessions: 2,
      maxAudioMinutesDay: 10,
      maxAttemptsPerItem: 3,
      requestsPerMinute: 20,
    });
    prismaMock.userQuotaUsage.upsert.mockResolvedValue({
      id: "usage-1",
      questionsAnswered: 14,
      sessionsCount: 0,
      audioMinutesUsed: 0,
    });
  });

  it("puts the remaining-limit condition inside the database update", async () => {
    prismaMock.userQuotaUsage.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userQuotaUsage.findUnique.mockResolvedValue({ questionsAnswered: 15 });

    const result = await QuotaManager.checkAndConsume("learner-1", "QUESTION");

    expect(prismaMock.userQuotaUsage.updateMany).toHaveBeenCalledWith({
      where: { id: "usage-1", questionsAnswered: { lte: 14 } },
      data: {
        questionsAnswered: { increment: 1 },
        requestCount: { increment: 1 },
      },
    });
    expect(result).toMatchObject({ allowed: true, remaining: 0, usageId: "usage-1" });
  });

  it("rejects a request when another concurrent request consumed the last slot", async () => {
    prismaMock.userQuotaUsage.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.userQuotaUsage.findUnique.mockResolvedValue({ questionsAnswered: 15 });

    const result = await QuotaManager.checkAndConsume("learner-1", "QUESTION");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.reason).toContain("15/15");
  });

  it("rejects invalid amounts before touching the database", async () => {
    const result = await QuotaManager.checkAndConsume("learner-1", "QUESTION", 0);

    expect(result).toMatchObject({ allowed: false, remaining: 0, reason: "Invalid quota amount." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
