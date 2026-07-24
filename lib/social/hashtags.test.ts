import { describe, it, expect } from "vitest";
import { buildHashtags } from "./hashtags";

describe("buildHashtags — content-aware generation", () => {
  it("builds hashtags from canonical tags first (real article data, not invented)", () => {
    const tags = buildHashtags({ tags: ["الذكاء الاصطناعي", "تعلم آلي"], categoryNameAr: "الشركات", categorySlug: "companies" });
    expect(tags).toContain("#الذكاء_الاصطناعي");
    expect(tags).toContain("#تعلم_آلي");
  });

  it("includes the category name as a hashtag when the category is not generic", () => {
    const tags = buildHashtags({ tags: ["نموذج لغوي"], categoryNameAr: "نماذج الذكاء الاصطناعي", categorySlug: "ai-models" });
    expect(tags.some((t) => t.includes("نماذج_الذكاء_الاصطناعي") || t.includes("نماذج"))).toBe(true);
  });

  it("omits a generic/broad category from hashtags to avoid spam", () => {
    const tags = buildHashtags({ tags: [], categoryNameAr: "الشركات", categorySlug: "companies" });
    expect(tags.every((t) => !t.includes("الشركات"))).toBe(true);
  });

  it("preserves #AI only when the category is genuinely AI-specific", () => {
    const aiRelevant = buildHashtags({ tags: [], categoryNameAr: "أدوات الذكاء الاصطناعي", categorySlug: "ai-tools" });
    expect(aiRelevant).toContain("#AI");

    const notAiRelevant = buildHashtags({ tags: [], categoryNameAr: "الشركات", categorySlug: "companies" });
    expect(notAiRelevant).not.toContain("#AI");
  });
});

describe("buildHashtags — deduplication and limits", () => {
  it("never returns more than 4 hashtags", () => {
    const tags = buildHashtags({
      tags: ["واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة"],
      categoryNameAr: "أدوات الذكاء الاصطناعي",
      categorySlug: "ai-tools",
    });
    expect(tags.length).toBeLessThanOrEqual(4);
  });

  it("never produces a duplicate hashtag even if the same tag appears twice (case-insensitive)", () => {
    const tags = buildHashtags({ tags: ["AI", "ai", "Ai"], categoryNameAr: "أدوات الذكاء الاصطناعي", categorySlug: "ai-tools" });
    const lower = tags.map((t) => t.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("normalizes spaces and punctuation into a single valid hashtag token", () => {
    const tags = buildHashtags({ tags: ["الذكاء الاصطناعي!", "تعلّم-آلي"], categoryNameAr: "الشركات", categorySlug: "companies" });
    for (const t of tags) {
      expect(t).toMatch(/^#[\p{L}\p{N}_]+$/u);
    }
  });

  it("skips a tag that normalizes to nothing usable (e.g. only punctuation)", () => {
    const tags = buildHashtags({ tags: ["!!!", "؟"], categoryNameAr: "أدوات الذكاء الاصطناعي", categorySlug: "ai-tools" });
    expect(tags.every((t) => t.length > 1)).toBe(true);
  });
});
