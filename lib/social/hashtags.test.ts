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

describe("buildHashtags — priority order (Telegram Experience Sprint 5: product/company > technology > category)", () => {
  it("ranks named-entity (product/company, Latin-script) tags ahead of descriptive (Arabic-script) tags", () => {
    const tags = buildHashtags({
      tags: ["الذكاء الاصطناعي", "GPT-5.6", "تعلم آلي", "OpenAI"],
      categoryNameAr: "نماذج الذكاء الاصطناعي",
      categorySlug: "ai-models",
    });
    const gptIndex = tags.indexOf("#GPT_56");
    const openaiIndex = tags.indexOf("#OpenAI");
    const genericIndex = tags.findIndex((t) => t.includes("الذكاء_الاصطناعي") || t.includes("تعلم_آلي"));

    expect(gptIndex).toBeGreaterThanOrEqual(0);
    expect(openaiIndex).toBeGreaterThanOrEqual(0);
    expect(gptIndex).toBeLessThan(genericIndex);
    expect(openaiIndex).toBeLessThan(genericIndex);
  });

  it("still fills remaining slots with descriptive tags and category when fewer than 4 named entities exist", () => {
    const tags = buildHashtags({
      tags: ["Perplexity"],
      categoryNameAr: "نماذج الذكاء الاصطناعي",
      categorySlug: "ai-models",
    });
    expect(tags[0]).toBe("#Perplexity");
    expect(tags.length).toBeGreaterThan(1); // category (and/or #AI) fills the rest
  });

  it("category comes after both named-entity and descriptive tags", () => {
    const tags = buildHashtags({
      tags: ["Notion_AI", "إنتاجية"],
      categoryNameAr: "نماذج الذكاء الاصطناعي",
      categorySlug: "ai-models",
    });
    const categoryIndex = tags.findIndex((t) => t.includes("نماذج"));
    const productIndex = tags.indexOf("#Notion_AI");
    const descriptiveIndex = tags.indexOf("#إنتاجية");
    expect(productIndex).toBeLessThan(categoryIndex === -1 ? Infinity : categoryIndex);
    expect(descriptiveIndex).toBeLessThan(categoryIndex === -1 ? Infinity : categoryIndex);
  });
});
