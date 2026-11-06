import { describe, expect, it } from "vitest";
import { parseRequestedCurrentLevel } from "../src/lib/profile/level-policy";

describe("self-selected starting level policy", () => {
  it.each(["A1", "A2", "B1", "B2", "C1", "C2"] as const)(
    "accepts CEFR level %s",
    (level) => {
      expect(parseRequestedCurrentLevel(level)).toBe(level);
    }
  );

  it("returns null when no self-selected level was requested", () => {
    expect(parseRequestedCurrentLevel(undefined)).toBeNull();
  });

  it.each(["A0", "beginner", "", 2, null])("rejects invalid level %j", (level) => {
    expect(() => parseRequestedCurrentLevel(level)).toThrow("Invalid current level");
  });
});
