import { describe, expect, it } from "vitest";
import { calculateNextDailyStreak } from "../src/lib/learning/daily-streak";

describe("daily learning streak", () => {
  it("starts at one when the learner has no training history", () => {
    expect(calculateNextDailyStreak(0, null, new Date("2026-11-07T12:00:00.000Z"))).toBe(1);
  });

  it("does not increment more than once on the same UTC day", () => {
    expect(
      calculateNextDailyStreak(4, new Date("2026-11-07T02:00:00.000Z"), new Date("2026-11-07T22:00:00.000Z"))
    ).toBe(4);
  });

  it("increments when training resumes on the next UTC day", () => {
    expect(
      calculateNextDailyStreak(4, new Date("2026-11-06T23:50:00.000Z"), new Date("2026-11-07T00:10:00.000Z"))
    ).toBe(5);
  });

  it("resets after a missed UTC day", () => {
    expect(
      calculateNextDailyStreak(9, new Date("2026-11-05T12:00:00.000Z"), new Date("2026-11-07T12:00:00.000Z"))
    ).toBe(1);
  });

  it("does not increment for a future-dated training record", () => {
    expect(
      calculateNextDailyStreak(3, new Date("2026-11-08T12:00:00.000Z"), new Date("2026-11-07T12:00:00.000Z"))
    ).toBe(1);
  });
});
