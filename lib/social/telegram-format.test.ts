import { describe, it, expect } from "vitest";
import { escapeTelegramHtml, buildTelegramCaption, truncateSummary } from "./telegram-format";

describe("escapeTelegramHtml", () => {
  it("escapes <, >, and & so raw editor/AI content cannot inject Telegram HTML markup", () => {
    const input = 'Is <b>this</b> safe & sound? <script>alert(1)</script>';
    const out = escapeTelegramHtml(input);
    expect(out).toBe("Is &lt;b&gt;this&lt;/b&gt; safe &amp; sound? &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<b>");
  });

  it("leaves plain Arabic text untouched", () => {
    const input = "هل نجحت OpenAI في تحويل ChatGPT؟";
    expect(escapeTelegramHtml(input)).toBe(input);
  });
});

describe("buildTelegramCaption", () => {
  it("wraps the title in a real <b> HTML tag, matching parse_mode: HTML", () => {
    const out = buildTelegramCaption("عنوان الخبر", "ملخص قصير.");
    expect(out).toContain("<b>عنوان الخبر</b>");
    expect(out).not.toContain("*عنوان الخبر*"); // the old, broken Markdown-style format
  });

  it("escapes a title containing HTML-like characters instead of injecting them raw", () => {
    const out = buildTelegramCaption("<b>عنوان</b> & \"مهم\"", "ملخص");
    expect(out).toContain("&lt;b&gt;عنوان&lt;/b&gt; &amp;");
    expect(out).not.toContain("<b>عنوان</b> &"); // raw injection would break parse_mode: HTML
  });

  it("escapes the summary as well as the title", () => {
    const out = buildTelegramCaption("عنوان", "ملخص يحتوي < و > و &");
    expect(out).toContain("ملخص يحتوي &lt; و &gt; و &amp;");
  });
});

describe("truncateSummary", () => {
  it("returns short text unchanged", () => {
    expect(truncateSummary("نص قصير")).toBe("نص قصير");
  });

  it("cuts at a sentence boundary when one exists within the limit", () => {
    const text = "الجملة الأولى مكتملة هنا. " + "كلمة ".repeat(60) + "نهاية طويلة جداً بدون فائدة إضافية.";
    const out = truncateSummary(text, 40);
    expect(out.endsWith(".")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(40);
  });

  it("falls back to a hard cut when no usable sentence boundary exists, preserving prior behavior", () => {
    const text = "ك".repeat(500); // no punctuation anywhere
    const out = truncateSummary(text, 200);
    expect(out.length).toBe(200);
  });
});
