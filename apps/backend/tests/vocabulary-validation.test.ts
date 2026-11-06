import { describe, expect, it } from "vitest";
import { normalizeVocabularyWord, parseVocabularyInput } from "../src/lib/vocabulary/vocabulary-policy";

describe("vocabulary validation logic", () => {
  const wordRegex = /^[a-z]+(?:[-'][a-z]+)*$/i;

  it("accepts valid English single words, hyphenated words, and contractions", () => {
    expect(wordRegex.test("serendipity")).toBe(true);
    expect(wordRegex.test("well-known")).toBe(true);
    expect(wordRegex.test("o'clock")).toBe(true);
    expect(wordRegex.test("Fluency")).toBe(true);
  });

  it("rejects phrases, numbers, special characters, and empty strings", () => {
    expect(wordRegex.test("")).toBe(false);
    expect(wordRegex.test("good morning")).toBe(false);
    expect(wordRegex.test("word123")).toBe(false);
    expect(wordRegex.test("test@word")).toBe(false);
    expect(wordRegex.test("-leading-hyphen")).toBe(false);
  });

  it.each([
    [" How, ", "how"],
    ["well-known.", "well-known"],
    ["(o'clock)", "o'clock"],
  ])("normalizes a selected word %j to %j", (input, expected) => {
    expect(normalizeVocabularyWord(input)).toBe(expected);
  });

  it.each(["good morning", "123", "...", ""])("rejects invalid selected text %j", (input) => {
    expect(normalizeVocabularyWord(input)).toBeNull();
  });

  it("parses a valid vocabulary payload", () => {
    expect(
      parseVocabularyInput({
        word: " How, ",
        translation: "كيف",
        exampleSentence: "How are you?",
        level: "A1",
      })
    ).toEqual({
      word: "how",
      translation: "كيف",
      exampleSentence: "How are you?",
      level: "A1",
    });
  });

  it("rejects a missing Arabic meaning", () => {
    expect(() => parseVocabularyInput({ word: "how", translation: "" })).toThrow(
      "translation"
    );
  });
});
