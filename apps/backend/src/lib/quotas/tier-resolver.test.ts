import { describe, expect, it } from "vitest";
import { selectEffectiveTier } from "./tier-resolver";

const freeTier = {
  id: "free",
  name: "FREE",
  isActive: true,
  maxDailyQuestions: 15,
  maxDailySessions: 2,
  maxAudioMinutesDay: 10,
  maxAttemptsPerItem: 3,
  requestsPerMinute: 20,
};

describe("selectEffectiveTier", () => {
  it("uses the user's active assigned tier", () => {
    const premium = { ...freeTier, id: "premium", name: "PREMIUM" };
    expect(selectEffectiveTier(premium, freeTier)).toEqual(premium);
  });

  it("falls back to FREE when no tier is assigned", () => {
    expect(selectEffectiveTier(null, freeTier)).toEqual(freeTier);
  });

  it("keeps an assigned inactive tier for existing users", () => {
    const legacy = { ...freeTier, id: "legacy", name: "LEGACY", isActive: false };
    expect(selectEffectiveTier(legacy, freeTier)).toEqual(legacy);
  });
});
