import { describe, it, expect } from "vitest";
import { markdownToHtml, buildAttributionFooter, buildWordPressBodyHtml } from "./html";

describe("markdownToHtml", () => {
  it("renders a simple paragraph", () => {
    expect(markdownToHtml("Hello world")).toBe("<p>Hello world</p>");
  });

  it("renders headings", () => {
    expect(markdownToHtml("## Heading")).toBe("<h2>Heading</h2>");
    expect(markdownToHtml("### Sub-heading")).toBe("<h3>Sub-heading</h3>");
  });

  it("renders bold and italic", () => {
    expect(markdownToHtml("**bold** and *italic*")).toBe("<p><strong>bold</strong> and <em>italic</em></p>");
  });

  it("renders unordered lists", () => {
    const result = markdownToHtml("- one\n- two");
    expect(result).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("splits a heading from a list item that immediately follows it with no blank line — real AI-generated FAQ sections do this (regression: Sonara draft #136606 rendered the first FAQ bullet inside the <h2>)", () => {
    const result = markdownToHtml("## الأسئلة المتداولة (FAQ)\n- **سؤال؟**\n  جواب.");
    expect(result).toBe("<h2>الأسئلة المتداولة (FAQ)</h2>\n<ul><li><strong>سؤال؟</strong></li><li>  جواب.</li></ul>");
  });

  it("splits a heading from plain-text lines that immediately follow it with no blank line", () => {
    const result = markdownToHtml("## Heading\nBody line one\nBody line two");
    expect(result).toBe("<h2>Heading</h2>\n<p>Body line one Body line two</p>");
  });

  it("handles multiple heading+list groups within the same blank-line-delimited block", () => {
    const result = markdownToHtml("## First\n- a\n## Second\n- b");
    expect(result).toBe("<h2>First</h2>\n<ul><li>a</li></ul>\n<h2>Second</h2>\n<ul><li>b</li></ul>");
  });

  it("escapes HTML-significant characters so markdown input cannot inject markup", () => {
    const result = markdownToHtml("<script>alert(1)</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("separates multiple paragraphs", () => {
    const result = markdownToHtml("First.\n\nSecond.");
    expect(result).toBe("<p>First.</p>\n<p>Second.</p>");
  });
});

describe("buildAttributionFooter", () => {
  const articleUrl = "https://www.lumiq.news/reviews/example-review?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=example-review";
  const homepageUrl = "https://www.lumiq.news/?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=homepage";

  it("contains the exact required Arabic attribution text", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    expect(footer).toContain("المصدر:");
    expect(footer).toContain("للمزيد من أخبار وتحليلات الذكاء الاصطناعي، ");
    expect(footer).toContain("اقرأ المزيد على Lumiq");
  });

  it("links 'Lumiq' (not لوميك) directly to the UTM-tagged original article URL", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    // href attributes are HTML-escaped (& -> &amp;), so compare against the
    // escaped form — the underlying URL (once a browser/WordPress parses
    // the attribute) is unchanged, this is standard, correct HTML escaping.
    const escapedArticleUrl = articleUrl.replace(/&/g, "&amp;");
    expect(footer).toContain(`<a href="${escapedArticleUrl}" target="_blank" rel="noopener">Lumiq</a>`);
    expect(footer).not.toContain("لوميك");
  });

  it("links 'اقرأ المزيد على Lumiq' to the UTM-tagged homepage URL as clean anchor text", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    const escapedHomepageUrl = homepageUrl.replace(/&/g, "&amp;");
    expect(footer).toContain(`<a href="${escapedHomepageUrl}" target="_blank" rel="noopener">اقرأ المزيد على Lumiq</a>`);
  });

  it("never renders a raw URL or UTM query string as visible anchor text", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    // Strip every href="..." attribute value, then check what's left (the
    // visible text and remaining markup) contains no raw URL/UTM tokens —
    // those are only allowed to live inside an href, never as visible text.
    const withoutHrefValues = footer.replace(/href="[^"]*"/g, 'href="…"');
    expect(withoutHrefValues).not.toContain("https://");
    expect(withoutHrefValues).not.toContain("http://");
    expect(withoutHrefValues).not.toContain("?utm_");
    expect(withoutHrefValues).not.toMatch(/utm_source|utm_medium|utm_campaign|utm_content/);
  });

  it("does not contain 'بالتعاون مع' or any sponsorship wording", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    expect(footer).not.toContain("بالتعاون مع");
    expect(footer).not.toMatch(/sponsor|sponsored|إعلان مدفوع/i);
  });

  it("contains a clear separator before the footer", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    expect(footer.trimStart().startsWith("<hr")).toBe(true);
  });

  it("does not hide any link (no display:none, no zero-size, no rel=nofollow link cloaking)", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    expect(footer).not.toMatch(/display:\s*none/i);
    expect(footer).not.toContain("nofollow");
  });

  it("escapes an articleUrl containing HTML-significant characters", () => {
    const footer = buildAttributionFooter('https://www.lumiq.news/reviews/x"><script>alert(1)</script>', homepageUrl);
    expect(footer).not.toContain("<script>");
  });

  it("has exactly two anchor tags — the article link and the homepage link", () => {
    const footer = buildAttributionFooter(articleUrl, homepageUrl);
    const anchorCount = (footer.match(/<a /g) ?? []).length;
    expect(anchorCount).toBe(2);
  });
});

describe("buildWordPressBodyHtml", () => {
  const articleUrl = "https://www.lumiq.news/reviews/x?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=x";
  const homepageUrl = "https://www.lumiq.news/?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=homepage";

  it("combines the rendered markdown body with the attribution footer", () => {
    const html = buildWordPressBodyHtml("Some **content**.", articleUrl, homepageUrl);
    expect(html).toContain("<strong>content</strong>");
    expect(html).toContain("المصدر:");
    expect(html.indexOf("<strong>content</strong>")).toBeLessThan(html.indexOf("المصدر:"));
  });

  it("keeps the full original body content (no truncation or summarization)", () => {
    const longBody = Array.from({ length: 20 }, (_, i) => `Paragraph number ${i}.`).join("\n\n");
    const html = buildWordPressBodyHtml(longBody, articleUrl, homepageUrl);
    for (let i = 0; i < 20; i++) {
      expect(html).toContain(`Paragraph number ${i}.`);
    }
  });
});
