import { describe, it, expect } from "vitest";
import { normalizePartnerId, buildArticleAttributionUrl, buildHomepageAttributionUrl } from "./attribution";

describe("normalizePartnerId", () => {
  it("lowercases an already-clean identifier", () => {
    expect(normalizePartnerId("Sonara")).toBe("sonara");
  });

  it("replaces spaces and non-alphanumeric characters with underscores", () => {
    expect(normalizePartnerId("CNN Arabic")).toBe("cnn_arabic");
  });

  it("collapses multiple separators into one underscore", () => {
    expect(normalizePartnerId("asharq--news")).toBe("asharq_news");
  });

  it("strips leading/trailing underscores produced by stripped punctuation", () => {
    expect(normalizePartnerId("  sonara!  ")).toBe("sonara");
  });

  it("is idempotent — normalizing an already-normalized id returns it unchanged", () => {
    expect(normalizePartnerId("cnn_arabic")).toBe("cnn_arabic");
  });
});

describe("buildArticleAttributionUrl", () => {
  it("builds the exact required URL shape for a partner and slug", () => {
    const url = buildArticleAttributionUrl("sonara", "best-ai-tools-2026");
    expect(url).toBe(
      "https://www.lumiq.news/reviews/best-ai-tools-2026?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=best-ai-tools-2026",
    );
  });

  it("works identically for an arbitrary future partner with no code change required", () => {
    const url = buildArticleAttributionUrl("cnn_arabic", "ai-investment-global-impact");
    expect(url).toContain("utm_source=cnn_arabic");
    expect(url).toContain("/reviews/ai-investment-global-impact");
    expect(url).toContain("utm_content=ai-investment-global-impact");
  });

  it("works for a second arbitrary future partner (asharq), proving no per-partner branching exists", () => {
    const url = buildArticleAttributionUrl("asharq", "some-slug");
    expect(url).toContain("utm_source=asharq");
  });

  it("uses utm_medium=referral and utm_campaign=partner_distribution — never invented values", () => {
    const url = buildArticleAttributionUrl("sonara", "x");
    expect(url).toContain("utm_medium=referral");
    expect(url).toContain("utm_campaign=partner_distribution");
  });

  it("uses the review slug as both the path segment and utm_content, so they can never drift apart", () => {
    const url = buildArticleAttributionUrl("sonara", "ai-tools-2026");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/reviews/ai-tools-2026");
    expect(parsed.searchParams.get("utm_content")).toBe("ai-tools-2026");
  });

  it("normalizes a mixed-case or spaced partnerId before placing it in the URL", () => {
    const url = buildArticleAttributionUrl("CNN Arabic", "x");
    expect(url).toContain("utm_source=cnn_arabic");
  });

  it("produces a valid, parseable URL for a slug containing Arabic characters", () => {
    const url = buildArticleAttributionUrl("sonara", "أفضل-أدوات-الذكاء-الاصطناعي");
    expect(() => new URL(url)).not.toThrow();
    const parsed = new URL(url);
    expect(parsed.searchParams.get("utm_content")).toBe("أفضل-أدوات-الذكاء-الاصطناعي");
  });

  it("URL-encodes special characters in the slug within the path", () => {
    const url = buildArticleAttributionUrl("sonara", "a b");
    // Space in a URL path is percent-encoded by the URL constructor.
    expect(url).not.toContain("/reviews/a b");
  });
});

describe("buildHomepageAttributionUrl", () => {
  it("builds the exact required homepage URL shape", () => {
    const url = buildHomepageAttributionUrl("sonara");
    expect(url).toBe(
      "https://www.lumiq.news/?utm_source=sonara&utm_medium=referral&utm_campaign=partner_distribution&utm_content=homepage",
    );
  });

  it("uses utm_content=homepage, never a slug or blank value", () => {
    const url = buildHomepageAttributionUrl("asharq");
    expect(new URL(url).searchParams.get("utm_content")).toBe("homepage");
  });

  it("works for an arbitrary future partner identically to Sonara", () => {
    const sonaraUrl = buildHomepageAttributionUrl("sonara");
    const futureUrl = buildHomepageAttributionUrl("future_partner");
    // Same shape, only utm_source differs.
    expect(sonaraUrl.replace("sonara", "future_partner")).toBe(futureUrl);
  });
});
