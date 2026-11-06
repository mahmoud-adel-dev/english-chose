import { CefrLevelEnum, type CefrLevel } from "@english-coach/contracts";

const WORD_PATTERN = /^[a-z]+(?:[-'][a-z]+)*$/i;

export interface VocabularyInput {
  word: string;
  translation: string;
  exampleSentence: string | null;
  level?: CefrLevel;
}

export function normalizeVocabularyWord(value: unknown): string | null {
  const trimmed = String(value ?? "")
    .trim()
    .replace(/^[^a-z]+|[^a-z]+$/gi, "")
    .toLowerCase();
  return WORD_PATTERN.test(trimmed) ? trimmed : null;
}

export function parseVocabularyInput(body: Record<string, unknown>): VocabularyInput {
  const word = normalizeVocabularyWord(body.word);
  if (!word) throw new Error("A valid English word is required");

  const translation = String(body.translation ?? "").trim();
  if (!translation) throw new Error("A translation is required");

  const level = body.level === undefined || body.level === null || body.level === ""
    ? undefined
    : CefrLevelEnum.parse(body.level);

  const exampleSentence = String(body.exampleSentence ?? "").trim() || null;
  return { word, translation, exampleSentence, level };
}
