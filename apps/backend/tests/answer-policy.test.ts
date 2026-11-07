import { describe, expect, it } from "vitest";
import {
  assessmentPromptForLevel,
  determineAssessedLevel,
  nextAdaptiveLevel,
  normalizeScore,
  validateEnglishAnswer,
} from "../src/lib/assessment/answer-policy";
import { allowsMockFallback, isMockAdapterEnabled } from "../src/lib/ai/task-router";
import { normalizeAssessmentEvaluation } from "../src/lib/assessment/evaluation-policy";
import { AiTaskType } from "@prisma/client";

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

  it("rejects excessively long answers before sending them to an AI provider", () => {
    const longAnswer = "word ".repeat(1_100);
    expect(validateEnglishAnswer(longAnswer, "B1")).toMatchObject({
      valid: false,
      code: "TOO_LONG",
    });
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

  it("places a learner with a 48 average at A1 even if one harder item passed", () => {
    expect(
      determineAssessedLevel([
        { targetLevel: "B1", score: 62 },
        { targetLevel: "B1", score: 44 },
        { targetLevel: "A2", score: 42 },
        { targetLevel: "A1", score: 45 },
        { targetLevel: "A1", score: 46 },
        { targetLevel: "A1", score: 49 },
      ])
    ).toMatchObject({ level: "A1", averageScore: 48 });
  });

  it("requires repeated evidence instead of promoting from one high item", () => {
    expect(
      determineAssessedLevel([
        { targetLevel: "C1", score: 95 },
        { targetLevel: "B1", score: 25 },
        { targetLevel: "A2", score: 30 },
        { targetLevel: "A1", score: 30 },
        { targetLevel: "A1", score: 35 },
        { targetLevel: "A1", score: 40 },
      ]).level
    ).toBe("A1");
  });

  it("recognizes consistent A2 evidence", () => {
    expect(
      determineAssessedLevel([
        { targetLevel: "A2", score: 68 },
        { targetLevel: "A2", score: 70 },
        { targetLevel: "A2", score: 66 },
        { targetLevel: "B1", score: 58 },
        { targetLevel: "A2", score: 72 },
        { targetLevel: "A2", score: 69 },
      ]).level
    ).toBe("A2");
  });

  it("forbids deterministic mock fallback for learner evaluation tasks", () => {
    expect(allowsMockFallback(AiTaskType.ANSWER_EVALUATION)).toBe(false);
    expect(allowsMockFallback(AiTaskType.CEFR_ASSESSMENT)).toBe(false);
    expect(allowsMockFallback(AiTaskType.PRONUNCIATION_ASSESSMENT)).toBe(false);
    expect(allowsMockFallback(AiTaskType.QUESTION_GENERATION)).toBe(true);
  });

  it("never enables mock evaluation or speech transcription", () => {
    expect(isMockAdapterEnabled(AiTaskType.ANSWER_EVALUATION, "test", "true")).toBe(false);
    expect(isMockAdapterEnabled(AiTaskType.CEFR_ASSESSMENT, "development", "true")).toBe(false);
    expect(isMockAdapterEnabled(AiTaskType.SPEECH_TO_TEXT, "test", "true")).toBe(false);
  });

  it("disables mocks in production even when the opt-in flag is set", () => {
    expect(isMockAdapterEnabled(AiTaskType.QUESTION_GENERATION, "production", "true")).toBe(false);
  });

  it("requires explicit opt-in for local development mocks", () => {
    expect(isMockAdapterEnabled(AiTaskType.QUESTION_GENERATION, "development", "false")).toBe(false);
    expect(isMockAdapterEnabled(AiTaskType.QUESTION_GENERATION, "development", "true")).toBe(true);
  });
});

describe("CEFR AI evaluation integrity", () => {
  const baseEvaluation = {
    isOnTopic: true,
    isMeaningfulEnglish: true,
    relevanceScore: 90,
    overallScore: 88,
    grammarScore: 86,
    vocabularyScore: 90,
    fluencyScore: 88,
    explanation: "إجابة واضحة ومرتبطة بالسؤال.",
  };

  it("rejects an evaluator payload that omits mandatory relevance flags", () => {
    const { isOnTopic: _isOnTopic, ...incomplete } = baseEvaluation;
    expect(normalizeAssessmentEvaluation(incomplete)).toBeNull();
  });

  it("caps a fluent but off-topic answer at 20", () => {
    const result = normalizeAssessmentEvaluation({
      ...baseEvaluation,
      isOnTopic: false,
      relevanceScore: 15,
      overallScore: 94,
    });
    expect(result).toMatchObject({ overallScore: 20, scoreCapReason: "OFF_TOPIC" });
  });

  it("caps non-meaningful English at 10", () => {
    const result = normalizeAssessmentEvaluation({
      ...baseEvaluation,
      isMeaningfulEnglish: false,
      overallScore: 92,
    });
    expect(result).toMatchObject({ overallScore: 10, scoreCapReason: "NOT_MEANINGFUL_ENGLISH" });
  });

  it("caps partial relevance and inconsistent component scores", () => {
    const partial = normalizeAssessmentEvaluation({
      ...baseEvaluation,
      relevanceScore: 55,
      overallScore: 90,
    });
    expect(partial?.overallScore).toBeLessThanOrEqual(45);

    const inconsistent = normalizeAssessmentEvaluation({
      ...baseEvaluation,
      relevanceScore: 90,
      overallScore: 95,
      grammarScore: 20,
      vocabularyScore: 20,
      fluencyScore: 20,
    });
    expect(inconsistent?.overallScore).toBe(30);
    expect(inconsistent?.scoreCapReason).toBe("INCONSISTENT_COMPONENT_SCORES");
  });

  it("documents why the old mock score produced B2 regardless of answer quality", () => {
    const levels = ["B1", "B2", "C1", "C2", "C2", "C2"] as const;
    const oldMockPlacement = determineAssessedLevel(
      levels.map((targetLevel) => ({ targetLevel, score: 82 }))
    );
    expect(oldMockPlacement).toMatchObject({ level: "B2", averageScore: 82 });
  });
});

