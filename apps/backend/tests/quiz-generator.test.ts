import { describe, expect, it } from "vitest";
import { buildArabicGrammarCoach, generate50QuestionQuiz } from "../src/lib/learn/quiz-generator";

describe("50-question quiz and Arabic grammar coach", () => {
  it("generates exactly 50 questions with Arabic explanations and examples", () => {
    const quiz = generate50QuestionQuiz({ level: "B1" });

    expect(quiz.totalQuestions).toBe(50);
    expect(quiz.questions).toHaveLength(50);
    expect(new Set(quiz.questions.map((question) => question.prompt)).size).toBe(50);

    for (const question of quiz.questions) {
      expect(question.grammarTitleArabic.length).toBeGreaterThan(0);
      expect(question.explanationArabic.length).toBeGreaterThan(20);
      expect(question.verbFormsArabic.length).toBeGreaterThan(0);
      expect(question.grammarExamples.length).toBeGreaterThan(0);
    }
  });

  it("explains do/does and the base verb rule in Arabic", () => {
    const coach = buildArabicGrammarCoach(
      "a1-present-simple",
      "Does she _____ every day?",
      "Does",
    );

    expect(coach.explanationArabic).toContain("المصدر");
    expect(coach.verbFormsArabic).toContain("do → does");
    expect(coach.examples).toHaveLength(2);
  });

  it("explains the third conditional and V3 forms", () => {
    const coach = buildArabicGrammarCoach(
      "b2-third-conditional-regrets",
      "If I had practiced more, I _____ the speaking test.",
      "would have passed",
    );

    expect(coach.explanationArabic).toContain("التصريف الثالث");
    expect(coach.verbFormsArabic).toContain("would have + V3");
  });
});
