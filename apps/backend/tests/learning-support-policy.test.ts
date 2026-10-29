import { describe, expect, it } from "vitest";
import { buildLearningSupportRequest } from "../src/lib/learning/learning-support-policy";

describe("learning support policy", () => {
  it("builds an Arabic translation request without adding an answer", () => {
    const result = buildLearningSupportRequest({
      action: "TRANSLATE",
      question: "Why is learning English important?",
      level: "B1",
    });

    expect(result.systemPrompt).toContain("translate");
    expect(result.systemPrompt).toContain("Arabic");
    expect(result.systemPrompt).toContain("Do not answer");
  });

  it("makes explanations level-aware and prevents answer disclosure", () => {
    const result = buildLearningSupportRequest({
      action: "EXPLAIN",
      question: "Discuss the impact of remote work.",
      level: "A2",
    });

    expect(result.systemPrompt).toContain("A2");
    expect(result.systemPrompt).toContain("without writing the answer");
  });

  it("labels model answers and requires English output", () => {
    const result = buildLearningSupportRequest({
      action: "MODEL_ANSWER",
      question: "Describe your weekend.",
      level: "B1",
    });

    expect(result.systemPrompt).toContain("model answer");
    expect(result.systemPrompt).toContain("English");
  });

  it("rejects unsupported actions and empty questions", () => {
    expect(() =>
      buildLearningSupportRequest({ action: "CHEAT", question: "Question", level: "B1" })
    ).toThrow("Unsupported learning support action");
    expect(() =>
      buildLearningSupportRequest({ action: "TRANSLATE", question: "   ", level: "B1" })
    ).toThrow("Question is required");
  });
});
