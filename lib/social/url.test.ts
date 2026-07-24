import { describe, it, expect } from "vitest";
import { buildUtmParams, buildTrackedArticleUrl, buildUtmContent, TELEGRAM_CAMPAIGN } from "./url";

describe("buildUtmParams — standardized Telegram UTM construction", () => {
  it("includes all four required parameters", () => {
    const params = new URLSearchParams(buildUtmParams("telegram", "some-review-slug"));
    expect(params.get("utm_source")).toBe("telegram");
    expect(params.get("utm_medium")).toBe("social");
    expect(params.get("utm_campaign")).toBe(TELEGRAM_CAMPAIGN);
    expect(params.get("utm_content")).toBe("some-review-slug");
  });

  it("uses a stable campaign value across calls unless explicitly overridden", () => {
    const a = new URLSearchParams(buildUtmParams("telegram", "slug-a"));
    const b = new URLSearchParams(buildUtmParams("telegram", "slug-b"));
    expect(a.get("utm_campaign")).toBe(b.get("utm_campaign"));
  });
});

describe("buildUtmContent — uniqueness and stability", () => {
  it("is stable for the same slug across repeated calls", () => {
    expect(buildUtmContent("my-review-slug")).toBe(buildUtmContent("my-review-slug"));
  });

  it("is unique across different slugs", () => {
    expect(buildUtmContent("review-a")).not.toBe(buildUtmContent("review-b"));
  });

  it("falls back to a stable, non-empty value when no slug is available", () => {
    expect(buildUtmContent(null)).toBe("homepage");
    expect(buildUtmContent(undefined)).toBe("homepage");
    expect(buildUtmContent("")).toBe("homepage");
  });
});

describe("buildTrackedArticleUrl — full URL assembly, canonical URL preserved", () => {
  it("builds a URL containing the review path and all four UTM params", () => {
    const url = buildTrackedArticleUrl("ai-news-example", "telegram");
    expect(url).toContain("/reviews/ai-news-example");
    expect(url).toContain("utm_source=telegram");
    expect(url).toContain("utm_medium=social");
    expect(url).toContain(`utm_campaign=${TELEGRAM_CAMPAIGN}`);
    expect(url).toContain("utm_content=ai-news-example");
  });

  it("never changes the canonical /reviews/<slug> path itself — only appends query params", () => {
    const url = buildTrackedArticleUrl("ai-news-example", "telegram");
    const [pathPart] = url.split("?");
    expect(pathPart.endsWith("/reviews/ai-news-example")).toBe(true);
  });

  it("falls back to the homepage URL (with UTM params) when no slug is given", () => {
    const url = buildTrackedArticleUrl(null, "telegram");
    expect(url).toContain("utm_content=homepage");
    expect(url).not.toContain("/reviews/");
  });
});
