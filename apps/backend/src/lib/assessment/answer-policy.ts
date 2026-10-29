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

const ASSESSMENT_PROMPTS: Record<CefrLevel, string[]> = {
  A1: [
    "Describe your family and where you live in 2-3 sentences.",
    "Introduce yourself, your daily routine, and what time you wake up.",
    "Describe your room or home and three objects you have in it.",
  ],
  A2: [
    "What did you do last weekend? Describe your activities in complete sentences.",
    "Talk about your favorite holiday or celebration and what you did there.",
    "Describe a trip you took in the past and what you enjoyed the most.",
  ],
  B1: [
    "Why is learning English important for your future career or travel?",
    "How does speaking English help you connect with people and opportunities?",
    "Describe a challenging problem you solved at work or during your studies.",
  ],
  B2: [
    "Do you think artificial intelligence will replace some human jobs? Explain your opinion.",
    "Should university education be completely free for all citizens? Give your arguments.",
    "Discuss the advantages and disadvantages of living in a major city versus a rural town.",
  ],
  C1: [
    "Analyze how remote work affects cities, productivity, and mental health.",
    "To what extent should governments regulate social media platforms to combat misinformation?",
    "Evaluate the economic and ethical implications of widespread automation in contemporary industries.",
  ],
  C2: [
    "Discuss the tension between technological determinism and the social shaping of technology.",
    "Critique the philosophical dilemma between individual autonomy and collective societal welfare.",
    "Assess the extent to which economic globalization homogenizes indigenous cultural identities.",
  ],
};

export function assessmentPromptForLevel(level: CefrLevel) {
  const prompts = ASSESSMENT_PROMPTS[level] || ASSESSMENT_PROMPTS["B1"];
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return { level, text: prompts[randomIndex] };
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
