import { describe, it, expect } from "vitest";
import { GRAMMAR_CATALOG, getGrammarTopicsByLevel, getGrammarTopicById } from "../src/lib/learn/grammar-catalog";
import { generate50QuestionQuiz } from "../src/lib/learn/quiz-generator";
import { TIPS_CATALOG, getTipsByCategory } from "../src/lib/learn/tips-catalog";

describe("Grammar & Learning Module", () => {
  it("provides comprehensive grammar topics across all CEFR levels", () => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
    for (const level of levels) {
      const topics = getGrammarTopicsByLevel(level);
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].ruleFormula).toBeDefined();
      expect(topics[0].examples.length).toBeGreaterThan(0);
      expect(topics[0].commonMistakes.length).toBeGreaterThan(0);
    }
  });

  it("can lookup grammar topic by specific ID", () => {
    const topic = getGrammarTopicById("a1-present-simple");
    expect(topic).toBeDefined();
    expect(topic?.title).toContain("Present Simple");
    expect(topic?.level).toBe("A1");
  });

  it("generates an exact 50-question quiz with 4 choices per question", () => {
    const quiz = generate50QuestionQuiz({ level: "B1" });
    expect(quiz.totalQuestions).toBe(50);
    expect(quiz.questions.length).toBe(50);

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      expect(q.questionNumber).toBe(i + 1);
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.explanation).toBeTruthy();
    }
  });

  it("generates a topic-specific 50-question quiz", () => {
    const quiz = generate50QuestionQuiz({ topicId: "a2-past-simple" });
    expect(quiz.totalQuestions).toBe(50);
    expect(quiz.questions.length).toBe(50);
  });

  it("provides pronunciation and listening master tips with audio drills", () => {
    const pronTips = getTipsByCategory("PRONUNCIATION");
    const listTips = getTipsByCategory("LISTENING");

    expect(pronTips.length).toBeGreaterThan(0);
    expect(listTips.length).toBeGreaterThan(0);

    const pVsB = pronTips.find((t) => t.id === "pron-p-vs-b");
    expect(pVsB).toBeDefined();
    expect(pVsB?.drills.length).toBeGreaterThan(0);
    expect(pVsB?.drills[0].phoneticIpa).toBeDefined();

    const schwa = listTips.find((t) => t.id === "list-the-schwa-sound");
    expect(schwa).toBeDefined();
  });
});
