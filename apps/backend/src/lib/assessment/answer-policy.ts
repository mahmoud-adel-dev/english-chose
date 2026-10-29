import type { CefrLevel } from "@english-coach/contracts";

export type AnswerValidationResult =
  | { valid: true }
  | {
      valid: false;
      code: "ARABIC_NOT_ALLOWED" | "GIBBERISH" | "TOO_SHORT";
      message: string;
    };

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MIN_WORDS: Record<CefrLevel, number> = {
  A1: 3,
  A2: 5,
  B1: 7,
  B2: 9,
  C1: 12,
  C2: 12,
};

const ASSESSMENT_PROMPTS: Record<CefrLevel, string> = {
  A1: "Describe your family and where you live in 2-3 sentences.",
  A2: "What did you do last weekend? Describe your activities in complete sentences.",
  B1: "Why is learning English important for your future career or travel?",
  B2: "Do you think artificial intelligence will replace some human jobs? Explain your opinion.",
  C1: "Analyze how remote work affects cities, productivity, and mental health.",
  C2: "Discuss the tension between technological determinism and the social shaping of technology.",
};

export function assessmentPromptForLevel(level: CefrLevel) {
  return { level, text: ASSESSMENT_PROMPTS[level] };
}

export function validateEnglishAnswer(
  text: string,
  targetLevel: CefrLevel
): AnswerValidationResult {
  const answer = text.trim();

  if (/[؀-ۿݐ-ݿࢠ-ࣿ]/u.test(answer)) {
    return {
      valid: false,
      code: "ARABIC_NOT_ALLOWED",
      message: "Please answer using English letters only.",
    };
  }

  const words = answer.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  const compactLetters = words.join("").toLowerCase();
  const uniqueLetters = new Set(compactLetters).size;
  const hasRepeatedRun = /([a-z])\1{4,}/i.test(compactLetters);
  const hasKeyboardNoise = words.some((word) =>
    /^(?:abc|qwe|asd|zxc|asdf|qwer|zxcv)[a-z]*$/i.test(word)
  );

  if (
    hasRepeatedRun ||
    hasKeyboardNoise ||
    (compactLetters.length >= 10 && uniqueLetters < 5)
  ) {
    return {
      valid: false,
      code: "GIBBERISH",
      message: "Please provide a meaningful English answer, not repeated or random letters.",
    };
  }

  if (words.length < MIN_WORDS[targetLevel]) {
    return {
      valid: false,
      code: "TOO_SHORT",
      message: `Please write at least ${MIN_WORDS[targetLevel]} English words so your answer can be assessed.`,
    };
  }

  return { valid: true };
}

export function nextAdaptiveLevel(
  currentLevel: CefrLevel,
  score: number
): CefrLevel {
  const currentIndex = LEVELS.indexOf(currentLevel);
  const direction = score >= 75 ? 1 : score < 45 ? -1 : 0;
  const nextIndex = Math.max(0, Math.min(LEVELS.length - 1, currentIndex + direction));
  return LEVELS[nextIndex];
}

export function normalizeScore(value: unknown): number | null {
  const score = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}
