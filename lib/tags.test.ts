import { describe, it, expect } from "vitest";
import { normalizeTag, tagToSlug, buildTagSummaries, reviewHasTag } from "./tags";

describe("normalizeTag — base normalization", () => {
  it("trims and strips a single leading definite article", () => {
    expect(normalizeTag("  الذكاء الاصطناعي  ")).toBe("ذكاء الاصطناعي");
  });
  it("converts underscores to spaces and collapses whitespace", () => {
    expect(normalizeTag("ذكاء_الاصطناعي")).toBe("ذكاء الاصطناعي");
    expect(normalizeTag("أمن   سيبراني")).toBe("أمن سيبراني");
  });
  it("is idempotent (applying twice is a no-op)", () => {
    for (const t of ["الذكاء الاصطناعي", "ذكاء_اصطناعي", "نماذج اللغة الكبيرة", "Nvidia", "أمن السيبراني"]) {
      expect(normalizeTag(normalizeTag(t))).toBe(normalizeTag(t));
    }
  });
  it("returns empty for blank/whitespace tags", () => {
    expect(normalizeTag("   ")).toBe("");
  });
});

describe("normalizeTag — approved alias merges", () => {
  it("AI variants (underscore / article-less) fold into ذكاء الاصطناعي", () => {
    const canon = "ذكاء الاصطناعي";
    expect(normalizeTag("الذكاء الاصطناعي")).toBe(canon);
    expect(normalizeTag("الذكاء_الاصطناعي")).toBe(canon);
    expect(normalizeTag("ذكاء اصطناعي")).toBe(canon);
    expect(normalizeTag("ذكاء_اصطناعي")).toBe(canon);
  });
  it("cybersecurity morphological variants fold into أمن سيبراني", () => {
    expect(normalizeTag("أمن سيبراني")).toBe("أمن سيبراني");
    expect(normalizeTag("أمن_سيبراني")).toBe("أمن سيبراني");
    expect(normalizeTag("أمن السيبراني")).toBe("أمن سيبراني");
    expect(normalizeTag("الأمن السيبراني")).toBe("أمن سيبراني");
  });
  it("language-model cluster folds into نماذج لغوية", () => {
    for (const v of ["نماذج اللغة", "نماذج اللغة الكبيرة", "نماذج لغوية كبيرة", "نماذج_لغوية_كبيرة", "النماذج اللغوية", "نماذج اللغوية"]) {
      expect(normalizeTag(v)).toBe("نماذج لغوية");
    }
    expect(normalizeTag("نماذج لغوية")).toBe("نماذج لغوية");
  });
  it("Latin brand casing is unified case-insensitively", () => {
    expect(normalizeTag("Nvidia")).toBe("NVIDIA");
    expect(normalizeTag("nvidia")).toBe("NVIDIA");
    expect(normalizeTag("NVIDIA")).toBe("NVIDIA");
  });
});

describe("normalizeTag — deliberately NOT merged (semantic distinctions kept)", () => {
  it("أنظمة الحماية stays separate from أمن سيبراني", () => {
    expect(normalizeTag("أنظمة الحماية")).not.toBe(normalizeTag("أمن سيبراني"));
  });
  it("الشركات (companies) is NOT folded into الشركات الكبرى (big companies)", () => {
    // الشركات → شركات ; الشركات الكبرى → شركات الكبرى — distinct canonicals
    expect(normalizeTag("الشركات")).not.toBe(normalizeTag("الشركات الكبرى"));
    expect(normalizeTag("شركات")).toBe(normalizeTag("الشركات")); // existing article-strip still merges these two
  });
});

describe("tagToSlug", () => {
  it("encodes the CANONICAL form, so variants share one slug", () => {
    expect(tagToSlug("ذكاء_اصطناعي")).toBe(tagToSlug("الذكاء الاصطناعي"));
    expect(tagToSlug("Nvidia")).toBe(tagToSlug("NVIDIA"));
  });
});

describe("buildTagSummaries", () => {
  it("groups variants under one canonical and picks the most common spelling as label", () => {
    const reviewTags = [
      ["الذكاء الاصطناعي"], ["الذكاء الاصطناعي"], ["ذكاء اصطناعي"], ["ذكاء_اصطناعي"],
    ];
    const summaries = buildTagSummaries(reviewTags);
    const ai = summaries.find((s) => s.canonical === "ذكاء الاصطناعي");
    expect(ai).toBeTruthy();
    expect(ai!.count).toBe(4);
    expect(ai!.label).toBe("الذكاء الاصطناعي"); // most frequent raw spelling
  });
  it("excludes __author: tags and anything below the 3-review threshold", () => {
    const reviewTags = [
      ["__author:zayd", "الروبوتات"], ["الروبوتات"], // only 2 → excluded
      ["__author:lina"],
    ];
    const summaries = buildTagSummaries(reviewTags);
    expect(summaries.some((s) => s.canonical.includes("author"))).toBe(false);
    expect(summaries.find((s) => s.canonical === "روبوتات")).toBeUndefined();
  });
});

describe("reviewHasTag", () => {
  it("matches across normalized variants", () => {
    expect(reviewHasTag(["ذكاء_اصطناعي"], "ذكاء الاصطناعي")).toBe(true);
    expect(reviewHasTag(["الأمن السيبراني"], "أمن سيبراني")).toBe(true);
    expect(reviewHasTag(["الروبوتات"], "أمن سيبراني")).toBe(false);
  });
});
