import { describe, it, expect } from "vitest";
import {
  classifyReviewTemplate,
  buildHighlights,
  buildTelegramMessageParts,
  renderTelegramMessage,
} from "./telegram-templates";

const baseCategory = { slug: "companies", nameAr: "الشركات" };

describe("classifyReviewTemplate — template classification", () => {
  it("classifies as comparison when the content contains a [[compare:...]] token", () => {
    const kind = classifyReviewTemplate({
      titleAr: "خبر عادي",
      content: "نص فيه [[compare:chatgpt-vs-claude|شاهد المقارنة]]",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("comparison");
  });

  it("classifies as tool when the content contains a [[tool:...]] token", () => {
    const kind = classifyReviewTemplate({
      titleAr: "خبر عادي",
      content: "نص فيه [[tool:notion-ai|Notion AI]]",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("tool");
  });

  it("classifies as tool when the category itself is ai-tools, even without a link token", () => {
    const kind = classifyReviewTemplate({
      titleAr: "أداة جديدة",
      content: "نص عادي بدون روابط",
      tags: [],
      category: { slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" },
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("tool");
  });

  it("classifies as guide when the category is tutorials", () => {
    const kind = classifyReviewTemplate({
      titleAr: "أي عنوان",
      content: "نص",
      tags: [],
      category: { slug: "tutorials", nameAr: "شروحات الذكاء الاصطناعي" },
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("guide");
  });

  it("classifies as guide from a how-to-style title even in another category", () => {
    const kind = classifyReviewTemplate({
      titleAr: "كيف تستخدم ChatGPT بفعالية",
      content: "نص",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("guide");
  });

  it("classifies as research when the category is research", () => {
    const kind = classifyReviewTemplate({
      titleAr: "دراسة جديدة",
      content: "نص",
      tags: [],
      category: { slug: "research", nameAr: "أبحاث ودراسات" },
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("research");
  });

  it("classifies as breaking when publishedAt is very recent (within 24h) and no stronger signal applies", () => {
    const kind = classifyReviewTemplate({
      titleAr: "تطور جديد في السوق",
      content: "نص عادي",
      tags: [],
      category: baseCategory,
      publishedAt: new Date(),
    });
    expect(kind).toBe("breaking");
  });

  it("classifies as general when no other signal applies and the article is not recent", () => {
    const kind = classifyReviewTemplate({
      titleAr: "تطور في السوق",
      content: "نص عادي",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
    });
    expect(kind).toBe("general");
  });

  it("is deterministic — the same input always yields the same classification", () => {
    const input = {
      titleAr: "كيف تعمل النماذج اللغوية؟",
      content: "[[tool:chatgpt|ChatGPT]]",
      tags: ["نماذج"],
      category: baseCategory,
      publishedAt: new Date("2022-05-01"),
    };
    const a = classifyReviewTemplate(input);
    const b = classifyReviewTemplate(input);
    expect(a).toBe(b);
  });
});

describe("buildHighlights — real-data-only, no invented facts", () => {
  it("includes a source-count highlight only when sources exist", () => {
    const withSources = buildHighlights({ category: baseCategory, tags: [], sources: [{ name: "TechCrunch" }, { name: "Wired" }] });
    expect(withSources.some((h) => h.includes("2") || h.includes("مصادر"))).toBe(true);
  });

  it("omits highlights entirely when no real signal exists (no sources, no category name, no reading time)", () => {
    const highlights = buildHighlights({ category: { nameAr: "" }, tags: [], sources: [] });
    expect(highlights).toEqual([]);
  });

  it("never returns more than 3 highlights", () => {
    const highlights = buildHighlights({
      category: baseCategory,
      tags: [],
      sources: [{ name: "A" }, { name: "B" }],
      readingMinutes: 7,
    });
    expect(highlights.length).toBeLessThanOrEqual(3);
  });
});

describe("buildTelegramMessageParts / renderTelegramMessage — full assembly", () => {
  it("truncates a long title/headline", () => {
    const longTitle = "عنوان طويل جداً ".repeat(15);
    const parts = buildTelegramMessageParts({
      titleAr: longTitle,
      summary: "ملخص قصير",
      content: "نص",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    expect(parts.headline.length).toBeLessThanOrEqual(90);
    expect(parts.headline.endsWith("…")).toBe(true);
  });

  it("truncates a long summary", () => {
    const longSummary = "جملة طويلة جداً بدون أي علامة ترقيم تدل على نهاية الجملة على الإطلاق هنا نص إضافي لملء المساحة ".repeat(3);
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان",
      summary: longSummary,
      content: "نص",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    expect(parts.summary.length).toBeLessThanOrEqual(200);
  });

  it("omits the highlights block in the rendered message when there are no highlights", () => {
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان",
      summary: "ملخص",
      content: "نص",
      tags: [],
      category: { slug: "x", nameAr: "" },
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    expect(parts.highlights).toEqual([]);
    const rendered = renderTelegramMessage(parts);
    expect(rendered).not.toContain("▪️");
  });

  it("selects the comparison CTA for a comparison-classified article", () => {
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان",
      summary: "ملخص",
      content: "[[compare:a-vs-b|شاهد]]",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    expect(parts.cta).toBe("شاهد المقارنة الكاملة");
  });

  it("selects the guide CTA for a guide-classified article", () => {
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان",
      summary: "ملخص",
      content: "نص",
      tags: [],
      category: { slug: "tutorials", nameAr: "شروحات الذكاء الاصطناعي" },
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    expect(parts.cta).toBe("اكتشف الدليل");
  });

  it("never contains literal Markdown asterisks around the headline", () => {
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان الخبر",
      summary: "ملخص",
      content: "نص",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
      sources: [],
    });
    const rendered = renderTelegramMessage(parts);
    expect(rendered).not.toMatch(/\*[^*]+\*/);
    expect(rendered).toContain("<b>");
  });

  it("does not repeat the same information across headline, summary, and highlights", () => {
    const parts = buildTelegramMessageParts({
      titleAr: "عنوان فريد جداً 12345",
      summary: "ملخص مختلف تماماً عن العنوان يشرح تفاصيل إضافية",
      content: "نص",
      tags: [],
      category: baseCategory,
      publishedAt: new Date("2020-01-01"),
      sources: [{ name: "Reuters" }],
    });
    expect(parts.headline).not.toBe(parts.summary);
    expect(parts.highlights.every((h) => h !== parts.headline && h !== parts.summary)).toBe(true);
  });
});
