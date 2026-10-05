import { describe, it, expect } from "vitest";
import {
  removeTashkeel,
  unifyLetters,
  toLatinDigits,
  toArabicDigits,
  collapseWhitespace,
  normalizeArabic,
  DEFAULT_NORMALIZE_OPTIONS,
} from "./arabic-text";

describe("removeTashkeel", () => {
  it("strips harakat but keeps letters", () => {
    expect(removeTashkeel("مُحَمَّدٌ")).toBe("محمد");
    expect(removeTashkeel("السَّلامُ عَلَيْكُم")).toBe("السلام عليكم");
  });
});

describe("unifyLetters", () => {
  it("unifies alef, yaa, taa marbuta, and hamza carriers", () => {
    expect(unifyLetters("أحمد")).toBe("احمد");
    expect(unifyLetters("إلى")).toBe("الي");
    expect(unifyLetters("مدرسة")).toBe("مدرسه");
    expect(unifyLetters("مسؤول")).toBe("مسوول");
    expect(unifyLetters("مئة")).toBe("ميه");
  });
});

describe("digit conversion", () => {
  it("converts Arabic-Indic to Latin", () => {
    expect(toLatinDigits("٢٠٢٦")).toBe("2026");
  });
  it("converts Latin to Arabic-Indic", () => {
    expect(toArabicDigits("2026")).toBe("٢٠٢٦");
  });
  it("round-trips", () => {
    expect(toLatinDigits(toArabicDigits("12345"))).toBe("12345");
  });
});

describe("collapseWhitespace", () => {
  it("collapses runs of spaces and trims", () => {
    expect(collapseWhitespace("  مرحبا    بالعالم  ")).toBe("مرحبا بالعالم");
  });
  it("preserves single paragraph breaks, caps blank lines", () => {
    expect(collapseWhitespace("سطر\n\n\n\nآخر")).toBe("سطر\n\nآخر");
  });
});

describe("normalizeArabic", () => {
  it("applies defaults (tashkeel + tatweel + whitespace)", () => {
    expect(normalizeArabic("مُحـــمَّد   علي", DEFAULT_NORMALIZE_OPTIONS)).toBe("محمد علي");
  });
  it("respects digit option", () => {
    expect(normalizeArabic("عام ٢٠٢٦", { ...DEFAULT_NORMALIZE_OPTIONS, digits: "toLatin" })).toBe("عام 2026");
  });
  it("unifies letters only when enabled", () => {
    expect(normalizeArabic("أحمد", DEFAULT_NORMALIZE_OPTIONS)).toBe("أحمد");
    expect(normalizeArabic("أحمد", { ...DEFAULT_NORMALIZE_OPTIONS, unifyLetters: true })).toBe("احمد");
  });
  it("is a no-op when everything is disabled", () => {
    const off = { removeTashkeel: false, unifyLetters: false, removeTatweel: false, collapseWhitespace: false, digits: "keep" as const };
    expect(normalizeArabic("مُحَمَّد  ", off)).toBe("مُحَمَّد  ");
  });
});
