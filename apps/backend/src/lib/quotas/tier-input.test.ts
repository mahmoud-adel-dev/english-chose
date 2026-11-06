import { describe, expect, it } from "vitest";
import { parseQuotaTierInput } from "./tier-input";

const validInput = {
  name: "STANDARD",
  maxDailyQuestions: 30,
  maxDailySessions: 4,
  maxAudioMinutesDay: 20.5,
  maxAttemptsPerItem: 3,
  requestsPerMinute: 40,
  isActive: true,
};

describe("parseQuotaTierInput", () => {
  it("normalizes a valid package name", () => {
    expect(parseQuotaTierInput({ ...validInput, name: " standard " })).toEqual(
      validInput
    );
  });

  it.each([
    ["empty name", { ...validInput, name: " " }],
    ["negative questions", { ...validInput, maxDailyQuestions: -1 }],
    ["fractional sessions", { ...validInput, maxDailySessions: 1.5 }],
    ["non-finite audio", { ...validInput, maxAudioMinutesDay: Infinity }],
    ["zero attempts", { ...validInput, maxAttemptsPerItem: 0 }],
  ])("rejects %s", (_, input) => {
    expect(() => parseQuotaTierInput(input)).toThrow();
  });
});
