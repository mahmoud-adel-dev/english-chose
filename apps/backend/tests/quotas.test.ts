import { describe, it, expect, beforeAll } from "vitest";
import { QuotaManager } from "../src/lib/quotas/quota-manager";
import { prisma } from "../src/lib/prisma";

describe("Quota Manager & Concurrency-Safe Enforcement", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create or find a test student user with an active trial
    const trialEndsAt = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    const user = await prisma.user.upsert({
      where: { email: "quota_test@englishcoach.app" },
      update: { trialEndsAt },
      create: {
        email: "quota_test@englishcoach.app",
        name: "Quota Test User",
        passwordHash: "hash",
        role: "STUDENT",
        trialEndsAt,
      },
    });
    testUserId = user.id;
    // Reset daily usage for clean test run
    await prisma.userQuotaUsage.deleteMany({
      where: { userId: testUserId },
    });
  });

  it("permits initial question attempts and decrements remaining quota", async () => {
    const res = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBeLessThan(15);
  }, 15_000);

  it("correctly refunds quota when an operation is cancelled", async () => {
    const before = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(before.allowed).toBe(true);

    await QuotaManager.refund(testUserId, "QUESTION", 1);

    const after = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(before.remaining);
  }, 15_000);

  it("rejects requests when daily question limit is exceeded", async () => {
    // Consume remaining up to limit
    const largeConsume = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 25);
    expect(largeConsume.allowed).toBe(false);
    expect(largeConsume.reason).toContain("Daily question quota exceeded");
  }, 15_000);

  it("blocks requests when the 6-day free trial has expired", async () => {
    const expiredUser = await prisma.user.upsert({
      where: { email: "expired_trial@englishcoach.app" },
      update: {
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired yesterday
        quotaTierId: null,
      },
      create: {
        email: "expired_trial@englishcoach.app",
        name: "Expired Trial User",
        passwordHash: "hash",
        role: "STUDENT",
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await QuotaManager.checkAndConsume(expiredUser.id, "QUESTION", 1);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("TRIAL_EXPIRED");
  }, 15_000);
});
