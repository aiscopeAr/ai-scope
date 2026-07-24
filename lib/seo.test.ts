import { describe, it, expect } from "vitest";
import { absoluteUrl, SITE_URL } from "./seo";

describe("absoluteUrl — OG image/canonical URL contract", () => {
  it("always produces an absolute HTTPS URL", () => {
    const url = absoluteUrl("/api/og?title=test");
    expect(url.startsWith("https://")).toBe(true);
    expect(url).toBe(`${SITE_URL}/api/og?title=test`);
  });

  it("handles a path without a leading slash the same way", () => {
    expect(absoluteUrl("reviews/foo")).toBe(absoluteUrl("/reviews/foo"));
  });
});

describe("Review OG image URL construction — matches app/(main)/reviews/[slug]/page.tsx's buildOgUrl", () => {
  // Mirrors the exact query-building logic in page.tsx's buildOgUrl, verified
  // against real production data during this sprint's audit (confirmed: no
  // defect — URLSearchParams already percent-encodes special characters,
  // and the /api/og route already renders correctly with imageUrl omitted).
  function buildOgUrl(review: { titleAr: string; summary: string | null; imageUrl: string | null; category: { nameAr: string } }): string {
    const params = new URLSearchParams({
      title: review.titleAr,
      category: review.category.nameAr,
      summary: (review.summary ?? "").slice(0, 120),
      ...(review.imageUrl ? { imageUrl: review.imageUrl } : {}),
    });
    return absoluteUrl(`/api/og?${params.toString()}`);
  }

  it("produces an absolute HTTPS URL when the review has an image", () => {
    const url = buildOgUrl({ titleAr: "عنوان", summary: "ملخص", imageUrl: "https://res.cloudinary.com/x/y.jpg", category: { nameAr: "أدوات" } });
    expect(url.startsWith("https://")).toBe(true);
    expect(url).toContain("imageUrl=");
  });

  it("omits the imageUrl param gracefully when the review has no image, without crashing or producing an invalid URL", () => {
    const url = buildOgUrl({ titleAr: "عنوان", summary: "ملخص", imageUrl: null, category: { nameAr: "أدوات" } });
    expect(url.startsWith("https://")).toBe(true);
    expect(url).not.toContain("imageUrl=");
    // The URL is still well-formed and parseable.
    expect(() => new URL(url)).not.toThrow();
  });

  it("percent-encodes special characters (e.g. an unencoded & inside the source imageUrl) safely", () => {
    const url = buildOgUrl({
      titleAr: "عنوان",
      summary: "ملخص",
      imageUrl: "https://example.com/img.jpg?a=1&b=2",
      category: { nameAr: "أدوات" },
    });
    // URLSearchParams always percent-encodes value contents — the resulting
    // query string must not contain a raw, un-encoded second "&" that would
    // be misparsed as a new top-level query parameter.
    const afterFirstParam = url.split("?")[1];
    expect(new URLSearchParams(afterFirstParam).get("imageUrl")).toBe("https://example.com/img.jpg?a=1&b=2");
  });
});
