import { describe, it, expect } from "vitest";
import { buildReviewTelegramMessage } from "./telegram-message";

describe("buildReviewTelegramMessage — shared production/preview formatter", () => {
  const review = {
    titleAr: "هل يمكن للذكاء الاصطناعي تحسين الأمن السيبراني؟",
    summary: "دراسة جديدة تكشف عن دور النماذج اللغوية في اكتشاف الثغرات الأمنية بسرعة أكبر.",
    content: "محتوى المقال [[tool:chatgpt|ChatGPT]] وتفاصيل إضافية عن الأمان.",
    tags: ["الأمن السيبراني", "الذكاء الاصطناعي"],
    category: { slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" },
    publishedAt: new Date("2020-01-01"),
    sources: [{ name: "Wired" }, { name: "TechCrunch" }],
    slug: "ai-cybersecurity-improvement",
  };

  it("produces identical output for two calls with the same input (what makes admin preview == production trustworthy)", () => {
    const first = buildReviewTelegramMessage(review);
    const second = buildReviewTelegramMessage(review);
    expect(first).toEqual(second);
  });

  it("classifies as tool given the [[tool:...]] token in content", () => {
    const result = buildReviewTelegramMessage(review);
    expect(result.template).toBe("tool");
  });

  it("renders valid escaped HTML with no literal asterisks", () => {
    const result = buildReviewTelegramMessage(review);
    expect(result.body).not.toMatch(/\*[^*]+\*/);
    expect(result.body).toContain("<b>");
  });

  it("escapes a title/summary containing raw HTML-like characters", () => {
    const withHtml = {
      ...review,
      titleAr: `عنوان <script>alert(1)</script> & "خطير"`,
    };
    const result = buildReviewTelegramMessage(withHtml);
    expect(result.body).not.toContain("<script>");
    expect(result.body).toContain("&lt;script&gt;");
  });

  it("produces at most 4 hashtags derived from real tags/category", () => {
    const result = buildReviewTelegramMessage(review);
    expect(result.hashtags.length).toBeLessThanOrEqual(4);
    expect(result.hashtags.length).toBeGreaterThan(0);
  });
});
