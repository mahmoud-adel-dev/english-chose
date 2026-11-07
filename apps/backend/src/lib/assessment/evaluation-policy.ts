import { normalizeScore } from "./answer-policy";

export interface NormalizedAssessmentEvaluation {
  isOnTopic: boolean;
  isMeaningfulEnglish: boolean;
  relevanceScore: number;
  rawOverallScore: number;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  explanation: string;
  scoreCapReason: string | null;
}

/**
 * Validates and constrains an AI assessment payload before it can influence
 * adaptive question selection or a learner's CEFR placement.
 *
 * The evaluator must explicitly confirm relevance and meaningful English.
 * Missing flags are treated as an invalid evaluation, never as a pass.
 */
export function normalizeAssessmentEvaluation(
  payload: unknown
): NormalizedAssessmentEvaluation | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const value = payload as Record<string, unknown>;
  const scores = value.scores && typeof value.scores === "object" && !Array.isArray(value.scores)
    ? value.scores as Record<string, unknown>
    : {};

  if (typeof value.isOnTopic !== "boolean" || typeof value.isMeaningfulEnglish !== "boolean") {
    return null;
  }

  const relevanceScore = normalizeScore(value.relevanceScore);
  const rawOverallScore = normalizeScore(value.overallScore ?? scores.overall);
  const grammarScore = normalizeScore(value.grammarScore ?? scores.grammar);
  const vocabularyScore = normalizeScore(value.vocabularyScore ?? scores.vocabulary);
  const fluencyScore = normalizeScore(value.fluencyScore ?? scores.fluency);
  const explanation = typeof value.explanation === "string" ? value.explanation.trim() : "";

  if (
    relevanceScore === null ||
    rawOverallScore === null ||
    grammarScore === null ||
    vocabularyScore === null ||
    fluencyScore === null ||
    !explanation
  ) {
    return null;
  }

  let overallScore = rawOverallScore;
  let scoreCapReason: string | null = null;

  if (!value.isMeaningfulEnglish) {
    overallScore = Math.min(overallScore, 10);
    scoreCapReason = "NOT_MEANINGFUL_ENGLISH";
  } else if (!value.isOnTopic || relevanceScore < 40) {
    overallScore = Math.min(overallScore, 20);
    scoreCapReason = "OFF_TOPIC";
  } else if (relevanceScore < 60) {
    overallScore = Math.min(overallScore, 45);
    scoreCapReason = "WEAK_RELEVANCE";
  } else if (relevanceScore < 75) {
    overallScore = Math.min(overallScore, 64);
    scoreCapReason = "PARTIAL_RELEVANCE";
  }

  // Prevent a contradictory payload (e.g. 92 overall but 15 in every skill)
  // from inflating the learner's adaptive path.
  const componentMean = Math.round((grammarScore + vocabularyScore + fluencyScore) / 3);
  if (overallScore > componentMean + 10) {
    overallScore = componentMean + 10;
    scoreCapReason = scoreCapReason ?? "INCONSISTENT_COMPONENT_SCORES";
  }

  return {
    isOnTopic: value.isOnTopic,
    isMeaningfulEnglish: value.isMeaningfulEnglish,
    relevanceScore,
    rawOverallScore,
    overallScore,
    grammarScore,
    vocabularyScore,
    fluencyScore,
    explanation: explanation.slice(0, 12_000),
    scoreCapReason,
  };
}
