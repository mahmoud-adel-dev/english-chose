import { describe, expect, it } from "vitest";

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
});

