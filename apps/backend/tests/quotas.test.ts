import { describe, it, expect, beforeAll } from "vitest";
import { QuotaManager } from "../src/lib/quotas/quota-manager";
import { prisma } from "../src/lib/prisma";

describe("Quota Manager & Concurrency-Safe Enforcement", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create or find a test student user
    const user = await prisma.user.upsert({
      where: { email: "quota_test@englishcoach.app" },
      update: {},
      create: {
        email: "quota_test@englishcoach.app",
        name: "Quota Test User",
        passwordHash: "hash",
        role: "STUDENT",
      },
    });
    testUserId = user.id;
  });

  it("permits initial question attempts and decrements remaining quota", async () => {
    const res = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBeLessThan(15);
  });

  it("correctly refunds quota when an operation is cancelled", async () => {
    const before = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(before.allowed).toBe(true);

    await QuotaManager.refund(testUserId, "QUESTION", 1);

    const after = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 1);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(before.remaining);
  });

  it("rejects requests when daily question limit is exceeded", async () => {
    // Consume remaining up to limit
    const largeConsume = await QuotaManager.checkAndConsume(testUserId, "QUESTION", 25);
    expect(largeConsume.allowed).toBe(false);
    expect(largeConsume.reason).toContain("Daily question quota exceeded");
  });
});
