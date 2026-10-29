import { describe, expect, it } from "vitest";
import {
  assessmentPromptForLevel,
  nextAdaptiveLevel,
  normalizeScore,
  validateEnglishAnswer,
} from "../src/lib/assessment/answer-policy";

describe("English answer policy", () => {
  it.each([
    ["أنا أتعلم الإنجليزية", "ARABIC_NOT_ALLOWED"],
    ["I like كرة القدم", "ARABIC_NOT_ALLOWED"],
    ["gggggggggggggggg", "GIBBERISH"],
    ["abc qwe zxc", "GIBBERISH"],
    ["... !!!", "TOO_SHORT"],
    ["Yes", "TOO_SHORT"],
  ])("rejects unassessable answer %j", (answer, code) => {
    expect(validateEnglishAnswer(answer, "B1")).toMatchObject({ valid: false, code });
  });

  it("accepts a relevant-length English response", () => {
    expect(
      validateEnglishAnswer(
        "Learning English is important because it helps me communicate with people when I travel.",
        "B1"
      )
    ).toEqual({ valid: true });
  });

  it.each([
    ["B1", 75, "B2"],
    ["B1", 74, "B1"],
    ["B1", 44, "A2"],
    ["A1", 0, "A1"],
    ["C2", 100, "C2"],
  ] as const)("moves %s with score %s to %s", (level, score, expected) => {
    expect(nextAdaptiveLevel(level, score)).toBe(expected);
  });

  it.each([
    [-5, 0],
    [101, 100],
    ["72", 72],
    [Number.NaN, null],
    [undefined, null],
  ])("normalizes score %j to %j", (value, expected) => {
    expect(normalizeScore(value)).toBe(expected);
  });

  it("provides a level-specific prompt from the assessment bank", () => {
    expect(assessmentPromptForLevel("B1")).toMatchObject({
      level: "B1",
      text: expect.stringContaining("English"),
    });
  });
});
