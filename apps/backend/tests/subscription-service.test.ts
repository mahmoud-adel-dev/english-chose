import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  getUserSubscriptionStatus,
  getSubscriptionPlans,
  subscribeToPlan,
  TRIAL_DURATION_MS,
} from "../src/lib/quotas/subscription-service";

describe("Subscription Service & 6-Day Trial Logic", () => {
  let activeTrialUserId: string;
  let expiredTrialUserId: string;

  beforeAll(async () => {
    // 1. User with active trial (created now)
    const activeUser = await prisma.user.upsert({
      where: { email: "active_trial_test@englishcoach.app" },
      update: {
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
        quotaTierId: null,
        subscriptionExpiresAt: null,
      },
      create: {
        email: "active_trial_test@englishcoach.app",
        name: "Active Trial Learner",
        passwordHash: "hash",
        role: "STUDENT",
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      },
    });
    activeTrialUserId = activeUser.id;

    // 2. User with expired trial (expired 2 days ago)
    const expiredUser = await prisma.user.upsert({
      where: { email: "expired_trial_test@englishcoach.app" },
      update: {
        trialEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        quotaTierId: null,
        subscriptionExpiresAt: null,
      },
      create: {
        email: "expired_trial_test@englishcoach.app",
        name: "Expired Trial Learner",
        passwordHash: "hash",
        role: "STUDENT",
        trialEndsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
    expiredTrialUserId = expiredUser.id;
  });

  it("identifies active 6-day trial learners and grants AI access", async () => {
    const status = await getUserSubscriptionStatus(activeTrialUserId);
    expect(status.canAccessAi).toBe(true);
    expect(status.isTrialActive).toBe(true);
    expect(status.isSubscribed).toBe(false);
    expect(status.trialDaysRemaining).toBeGreaterThanOrEqual(5);
    expect(status.reason).toBeUndefined();
  });

  it("blocks AI access when the 6-day trial has expired without an active subscription", async () => {
    const status = await getUserSubscriptionStatus(expiredTrialUserId);
    expect(status.canAccessAi).toBe(false);
    expect(status.isTrialActive).toBe(false);
    expect(status.isSubscribed).toBe(false);
    expect(status.trialDaysRemaining).toBe(0);
    expect(status.reason).toContain("expired");
  });

  it("returns all plans with monthly and discounted annual pricing", async () => {
    const { plans, userStatus } = await getSubscriptionPlans(activeTrialUserId);
    expect(plans.length).toBeGreaterThanOrEqual(4);

    const basic = plans.find((p) => p.name === "BASIC");
    const pro = plans.find((p) => p.name === "PRO");
    const premium = plans.find((p) => p.name === "PREMIUM");

    expect(basic).toBeDefined();
    expect(basic?.priceMonthlyEgp).toBe(300);
    expect(basic?.priceYearlyEgp).toBe(2880);
    expect(basic?.annualSavingsPercent).toBe(20);

    expect(pro).toBeDefined();
    expect(pro?.priceMonthlyEgp).toBe(500);
    expect(pro?.priceYearlyEgp).toBe(4500);
    expect(pro?.annualSavingsPercent).toBe(25);
    expect(pro?.badge).toContain("الأكثر اختياراً");

    expect(premium).toBeDefined();
    expect(premium?.priceMonthlyEgp).toBe(750);
    expect(premium?.priceYearlyEgp).toBe(6300);
    expect(premium?.annualSavingsPercent).toBe(30);

    expect(userStatus?.isTrialActive).toBe(true);
  });

  it("activates a subscription and grants full AI access to an expired trial user", async () => {
    const subResult = await subscribeToPlan(expiredTrialUserId, "PRO", "MONTHLY");
    expect(subResult.success).toBe(true);
    expect(subResult.tierName).toBe("PRO");

    const statusAfter = await getUserSubscriptionStatus(expiredTrialUserId);
    expect(statusAfter.canAccessAi).toBe(true);
    expect(statusAfter.isSubscribed).toBe(true);
    expect(statusAfter.tierName).toBe("PRO");
    expect(statusAfter.subscriptionExpiresAt).toBeDefined();
  });
});
