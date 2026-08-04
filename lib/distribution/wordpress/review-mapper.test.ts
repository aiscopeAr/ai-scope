import { describe, it, expect } from "vitest";
import { mapReviewToDistributableContent, extractReviewSourceLinks, type ReviewMapperInput } from "./review-mapper";

function buildReview(overrides: Partial<ReviewMapperInput> = {}): ReviewMapperInput {
  return {
    id: "review-123",
    titleAr: "أفضل أدوات الذكاء الاصطناعي",
    content: "## مقدمة\n\nهذا محتوى المقال الكامل.",
    summary: "ملخص المقال.",
    slug: "best-ai-tools",
    imageUrl: "https://res.cloudinary.com/example/image.webp",
    tags: ["AI", "أدوات"],
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    category: { slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" },
    sources: [{ title: "Source One", url: "https://example.com/a", name: "Example" }],
    ...overrides,
  };
}

describe("mapReviewToDistributableContent", () => {
  it("maps id to contentId", () => {
    const content = mapReviewToDistributableContent(buildReview());
    expect(content.id).toBe("review-123");
  });

  it("maps titleAr to title verbatim (no rewriting)", () => {
    const content = mapReviewToDistributableContent(buildReview());
    expect(content.title).toBe("أفضل أدوات الذكاء الاصطناعي");
  });

  it("maps content to body verbatim, preserving the full original text", () => {
    const review = buildReview({ content: "Full original body text that must not be truncated or altered in any way." });
    const content = mapReviewToDistributableContent(review);
    expect(content.body).toBe("Full original body text that must not be truncated or altered in any way.");
  });

  it("maps summary through unchanged", () => {
    const content = mapReviewToDistributableContent(buildReview());
    expect(content.summary).toBe("ملخص المقال.");
  });

  it("builds an absolute canonical URL from the slug", () => {
    const content = mapReviewToDistributableContent(buildReview({ slug: "my-review-slug" }));
    expect(content.canonicalUrl).toMatch(/\/reviews\/my-review-slug$/);
    expect(content.canonicalUrl).toMatch(/^https?:\/\//);
  });

  it("maps a present imageUrl through", () => {
    const content = mapReviewToDistributableContent(buildReview({ imageUrl: "https://example.com/img.webp" }));
    expect(content.imageUrl).toBe("https://example.com/img.webp");
  });

  it("maps a null imageUrl to undefined rather than null or a placeholder", () => {
    const content = mapReviewToDistributableContent(buildReview({ imageUrl: null }));
    expect(content.imageUrl).toBeUndefined();
  });

  it("maps tags through unchanged", () => {
    const content = mapReviewToDistributableContent(buildReview({ tags: ["a", "b", "c"] }));
    expect(content.tags).toEqual(["a", "b", "c"]);
  });

  it("maps category to the category's slug", () => {
    const content = mapReviewToDistributableContent(buildReview({ category: { slug: "reviews", nameAr: "تقارير" } }));
    expect(content.category).toBe("reviews");
  });

  it("does not invent a canonicalUrl or title when the review is otherwise minimal", () => {
    const content = mapReviewToDistributableContent(
      buildReview({ tags: [], sources: [], imageUrl: null }),
    );
    expect(content.title).toBe("أفضل أدوات الذكاء الاصطناعي"); // still exactly the real title
    expect(content.tags).toEqual([]);
  });
});

describe("extractReviewSourceLinks", () => {
  it("extracts title and url from well-formed source entries", () => {
    const links = extractReviewSourceLinks(buildReview());
    expect(links).toEqual([{ title: "Source One", url: "https://example.com/a" }]);
  });

  it("falls back to name when title is absent", () => {
    const links = extractReviewSourceLinks(buildReview({ sources: [{ name: "Fallback Name", url: "https://example.com/b" }] }));
    expect(links[0].title).toBe("Fallback Name");
  });

  it("falls back to the URL itself when neither title nor name is present", () => {
    const links = extractReviewSourceLinks(buildReview({ sources: [{ url: "https://example.com/c" }] }));
    expect(links[0].title).toBe("https://example.com/c");
  });

  it("drops entries without a url instead of inventing one", () => {
    const links = extractReviewSourceLinks(buildReview({ sources: [{ title: "No URL here" }] }));
    expect(links).toEqual([]);
  });

  it("returns an empty array when sources is not an array (malformed Json)", () => {
    expect(extractReviewSourceLinks(buildReview({ sources: "not-an-array" }))).toEqual([]);
    expect(extractReviewSourceLinks(buildReview({ sources: null }))).toEqual([]);
  });

  it("returns an empty array when sources is an empty array", () => {
    expect(extractReviewSourceLinks(buildReview({ sources: [] }))).toEqual([]);
  });
});
