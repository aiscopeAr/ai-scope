import { describe, it, expect } from "vitest";
import { analyzeText } from "./word-count";

describe("analyzeText", () => {
  it("returns all-zero for empty text", () => {
    expect(analyzeText("")).toEqual({
      words: 0,
      charsWithSpaces: 0,
      charsNoSpaces: 0,
      sentences: 0,
      lines: 0,
      readingMinutes: 0,
    });
  });

  it("counts Arabic words and characters", () => {
    const s = analyzeText("مرحبا بالعالم");
    expect(s.words).toBe(2);
    expect(s.charsWithSpaces).toBe(13);
    expect(s.charsNoSpaces).toBe(12);
  });

  it("counts words regardless of extra whitespace", () => {
    expect(analyzeText("  one   two\tthree \n four ").words).toBe(4);
  });

  it("counts sentences across Latin and Arabic terminators", () => {
    expect(analyzeText("جملة أولى. جملة ثانية؟ ثالثة!").sentences).toBe(3);
    expect(analyzeText("no terminator here").sentences).toBe(1);
  });

  it("counts non-empty lines", () => {
    expect(analyzeText("سطر\n\nسطر آخر\n").lines).toBe(2);
  });

  it("estimates reading time (min 1 for non-empty, ceil by 200 wpm)", () => {
    expect(analyzeText("كلمة").readingMinutes).toBe(1);
    const longText = Array.from({ length: 450 }, () => "كلمة").join(" ");
    expect(analyzeText(longText).readingMinutes).toBe(3);
  });

  it("treats emoji as single characters (unicode-aware)", () => {
    expect(analyzeText("🎉").charsWithSpaces).toBe(1);
  });
});
